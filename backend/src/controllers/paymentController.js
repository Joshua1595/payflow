const pool = require("../config/db");
const {
  createRequestHash,
  getIdempotencyKey,
} = require("../services/idempotencyService");
const {
  recordPaymentFailure,
} = require("../services/paymentFailureService");
const { createAuditLog } = require("../services/auditService");
const createPayment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { merchantId, amount, currency } = req.body;

    if (!merchantId || amount === undefined || !currency) {
      return res.status(400).json({
        success: false,
        message: "merchantId, amount and currency are required",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a positive number",
      });
    }

    const normalizedCurrency = String(currency).toUpperCase();

    if (normalizedCurrency !== "ETB") {
      return res.status(400).json({
        success: false,
        message: "Only ETB payments are currently supported",
      });
    }
    

    await client.query("BEGIN");

    // Check merchant
    const merchantResult = await client.query(
      `SELECT id, user_id, status
       FROM merchants
       WHERE id = $1`,
      [merchantId]
    );

    if (merchantResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    const merchant = merchantResult.rows[0];

    if (merchant.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Merchant is not active",
      });
    }

    const paymentReference = `PAY-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    const paymentResult = await client.query(
      `INSERT INTO payments
       (merchant_id, customer_id, amount, currency, status, reference)
       VALUES ($1, $2, $3, $4, 'created', $5)
       RETURNING
         id,
         merchant_id,
         customer_id,
         amount,
         currency,
         status,
         reference,
         created_at`,
      [
        merchantId,
        req.user.id,
        numericAmount,
        normalizedCurrency,
        paymentReference,
      ]
    );

    await client.query("COMMIT");
    const payment = paymentResult.rows[0];
    await createAuditLog({
      userId: req.user.id,
      action: "PAYMENT_CREATED",
      entityType: "payment",
      entityId: payment.id,
      newValues: {
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        reference: payment.reference,
        merchant_id: payment.merchant_id,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Payment created successfully",
      payment: paymentResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create payment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create payment",
    });
  } finally {
    client.release();
  }
};
const processPayment = async (req, res) => {
  const client = await pool.connect();
  const idempotencyKey = getIdempotencyKey(req);
  let clientReleased = false;
  if (!idempotencyKey) {
    client.release();

    return res.status(400).json({
      success: false,
      message: "Idempotency-Key header is required",
    });
  }

  const requestHash = createRequestHash({
    paymentId: req.params.paymentId,
    body: req.body,
  });

  try {
    const { paymentId } = req.params;

    await client.query("BEGIN");
    const existingKey = await client.query(
      `SELECT
        id,
        request_hash,
        status,
        response_status,
        response_body
      FROM idempotency_keys
      WHERE user_id = $1
        AND idempotency_key = $2
      FOR UPDATE`,
      [req.user.id, idempotencyKey]
    );

    if (existingKey.rows.length > 0) {
      const existing = existingKey.rows[0];

      if (existing.request_hash !== requestHash) {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message: "Idempotency key was already used with a different request",
        });
      }

      if (existing.status === "completed") {
        await client.query("ROLLBACK");

        return res.status(existing.response_status).json(
          existing.response_body
        );
      }

      if (existing.status === "processing") {
        await client.query("ROLLBACK");

        return res.status(409).json({
          success: false,
          message: "Payment request is already being processed",
        });
      }
    }
    await client.query(
      `INSERT INTO idempotency_keys
      (
        user_id,
        idempotency_key,
        request_path,
        request_method,
        request_hash,
        status
      )
      VALUES ($1, $2, $3, $4, $5, 'processing')`,
      [
        req.user.id,
        idempotencyKey,
        req.originalUrl,
        req.method,
        requestHash,
      ]
    );

    // 1. Lock the payment
    const paymentResult = await client.query(
      `SELECT
         id,
         merchant_id,
         customer_id,
         amount,
         currency,
         status,
         reference
       FROM payments
       WHERE id = $1
       FOR UPDATE`,
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const payment = paymentResult.rows[0];

    // 2. Make sure the logged-in customer owns the payment
    if (payment.customer_id !== req.user.id) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "You are not allowed to process this payment",
      });
    }

    // 3. Payment must be in created state
    if (payment.status !== "created") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `Payment cannot be processed from status: ${payment.status}`,
      });
    }

    // 4. Lock customer wallet
    const walletResult = await client.query(
      `SELECT
         id,
         user_id,
         balance,
         currency,
         status
       FROM wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [payment.customer_id]
    );

    if (walletResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Customer wallet not found",
      });
    }

    const wallet = walletResult.rows[0];

    // 5. Check wallet status
    if (wallet.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Customer wallet is not active",
      });
    }

    // 6. Check currency
    if (wallet.currency !== payment.currency) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Payment currency does not match wallet currency",
      });
    }

    // 7. Check balance
    if (Number(wallet.balance) < Number(payment.amount)) {
      const failedAttempt = await recordPaymentFailure(
        client,
        payment,
        1,
        "INSUFFICIENT_FUNDS",
        "Customer wallet has insufficient funds"
      );

      const responseBody = {
        success: false,
        message: "Insufficient wallet balance",
        payment: {
          id: payment.id,
          status: "failed",
        },
        paymentAttempt: failedAttempt,
      };

      // Save the failed response for idempotency
      await client.query(
        `UPDATE idempotency_keys
        SET status = 'completed',
            response_status = $1,
            response_body = $2
        WHERE user_id = $3
          AND idempotency_key = $4`,
        [
          400,
          responseBody,
          req.user.id,
          idempotencyKey,
        ]
      );

      // Commit the failed payment attempt/status
      await client.query("COMMIT");

      // Create audit log AFTER the financial transaction commits
      await createAuditLog({
        userId: req.user.id,
        action: "PAYMENT_FAILED",
        entityType: "payment",
        entityId: payment.id,
        oldValues: {
          status: payment.status,
        },
        newValues: {
          status: "failed",
          amount: payment.amount,
          currency: payment.currency,
          reason: "INSUFFICIENT_FUNDS",
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      });

      return res.status(400).json(responseBody);
    }

    // 8. Lock merchant account
    const merchantAccountResult = await client.query(
      `SELECT
         id,
         merchant_id,
         settlement_currency,
         available_balance,
         pending_balance,
         status
       FROM merchant_accounts
       WHERE merchant_id = $1
       FOR UPDATE`,
      [payment.merchant_id]
    );

    if (merchantAccountResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Merchant account not found",
      });
    }

    const merchantAccount = merchantAccountResult.rows[0];

    // 9. Check merchant account
    if (merchantAccount.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Merchant account is not active",
      });
    }

    if (merchantAccount.settlement_currency !== payment.currency) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Payment currency does not match merchant account currency",
      });
    }

    // 10. Change payment to processing
    await client.query(
      `UPDATE payments
       SET status = 'processing'
       WHERE id = $1`,
      [payment.id]
    );

    // 11. Debit customer wallet
    const updatedWallet = await client.query(
      `UPDATE wallets
       SET balance = balance - $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING
         id,
         user_id,
         balance,
         currency,
         status,
         updated_at`,
      [payment.amount, wallet.id]
    );

    // 12. Credit merchant account
    const updatedMerchantAccount = await client.query(
      `UPDATE merchant_accounts
       SET available_balance = available_balance + $1
       WHERE id = $2
       RETURNING
         id,
         merchant_id,
         account_number,
         settlement_currency,
         available_balance,
         pending_balance,
         status`,
      [payment.amount, merchantAccount.id]
    );

    // 13. Create customer transaction
    const transactionReference = `PMT-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    const transactionResult = await client.query(
      `INSERT INTO transactions
      (
        wallet_id,
        payment_id,
        type,
        amount,
        currency,
        status,
        reference
      )
      VALUES ($1, $2, 'payment', $3, $4, 'completed', $5)
      RETURNING
        id,
        wallet_id,
        payment_id,
        type,
        amount,
        currency,
        status,
        reference,
        created_at`,
      [
        wallet.id,
        payment.id,
        payment.amount,
        payment.currency,
        transactionReference,
      ]
    );

    const transaction = transactionResult.rows[0];

    // 14. Create customer ledger debit
    await client.query(
      `INSERT INTO ledger_entries
       (transaction_id, wallet_id, entry_type, amount, currency, description)
       VALUES ($1, $2, 'debit', $3, $4, $5)`,
      [
        transaction.id,
        wallet.id,
        payment.amount,
        payment.currency,
        "Payment sent to merchant",
      ]
    );

    // 15. Mark payment completed
    const completedPayment = await client.query(
      `UPDATE payments
      SET status = 'completed'
      WHERE id = $1
      RETURNING
        id,
        merchant_id,
        customer_id,
        amount,
        currency,
        status,
        reference,
        created_at`,
      [payment.id]
    );
    const attemptResult = await client.query(
      `INSERT INTO payment_attempts
      (
        payment_id,
        provider,
        provider_transaction_id,
        attempt_number,
        status,
        amount,
        currency
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        payment_id,
        provider,
        provider_transaction_id,
        attempt_number,
        status,
        amount,
        currency,
        created_at`,
      [
        payment.id,
        "payflow_wallet",
        transaction.reference,
        1,
        "successful",
        payment.amount,
        payment.currency,
      ]
    );

    const paymentAttempt = attemptResult.rows[0];

    const responseBody = {
      success: true,
      message: "Payment processed successfully",
      payment: completedPayment.rows[0],
      paymentAttempt,
      transaction,
      customerWallet: updatedWallet.rows[0],
      merchantAccount: updatedMerchantAccount.rows[0],
    };

    await client.query(
      `UPDATE idempotency_keys
      SET status = 'completed',
          response_status = $1,
          response_body = $2
      WHERE user_id = $3
        AND idempotency_key = $4`,
      [
        200,
        responseBody,
        req.user.id,
        idempotencyKey,
      ]
    );

    await client.query("COMMIT");

    client.release();
    clientReleased = true;

    await createAuditLog({
      userId: req.user.id,
      action: "PAYMENT_COMPLETED",
      entityType: "payment",
      entityId: payment.id,
      oldValues: {
        status: "processing",
      },
      newValues: {
        status: "completed",
        amount: payment.amount,
        currency: payment.currency,
        reference: payment.reference,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(200).json(responseBody);
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Process payment error:", error);

    res.status(500).json({
      success: false,
      message: "Payment processing failed",
    });
  } finally {
     if (!client.released) {
        client.release();
     }
  }
};
const getPaymentById = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const result = await pool.query(
      `SELECT
         p.id,
         p.merchant_id,
         p.customer_id,
         p.amount,
         p.currency,
         p.status,
         p.reference,
         p.created_at,
         m.business_name
       FROM payments p
       JOIN merchants m
         ON p.merchant_id = m.id
       WHERE p.id = $1
         AND (
           p.customer_id = $2
           OR m.user_id = $2
         )`,
      [paymentId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      payment: result.rows[0],
    });
  } catch (error) {
    console.error("Get payment error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get payment",
    });
  }
};
module.exports = {
  createPayment,
  processPayment,
  getPaymentById,
};