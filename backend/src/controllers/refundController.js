const pool = require("../config/db");
const { createAuditLog } = require("../services/auditService");
const createRefund = async (req, res) => {
  const client = await pool.connect();
  let clientReleased = false;

  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Refund amount must be greater than 0",
      });
    }

    await client.query("BEGIN");

    const paymentResult = await client.query(
      `SELECT
         p.id,
         p.merchant_id,
         p.customer_id,
         p.amount,
         p.currency,
         p.status,
         p.reference
       FROM payments p
       WHERE p.id = $1
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

    if (payment.status !== "completed") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Only completed payments can be refunded",
      });
    }

    // Make sure the requested refund does not exceed the payment.
    const refundTotalResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_refunded
       FROM refunds
       WHERE payment_id = $1
         AND status IN ('pending', 'processing', 'completed')`,
      [paymentId]
    );

    const totalRefunded = Number(
      refundTotalResult.rows[0].total_refunded
    );

    const remainingRefundable =
      Number(payment.amount) - totalRefunded;

    if (Number(amount) > remainingRefundable) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Refund amount exceeds refundable amount",
      });
    }

    const reference = `REF-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    const refundResult = await client.query(
      `INSERT INTO refunds
       (
         payment_id,
         amount,
         currency,
         status,
         reference,
         reason
       )
       VALUES ($1, $2, $3, 'pending', $4, $5)
       RETURNING
         id,
         payment_id,
         amount,
         currency,
         status,
         reference,
         reason,
         created_at`,
      [
        payment.id,
        amount,
        payment.currency,
        reference,
        reason || null,
      ]
    );
    const refund = refundResult.rows[0];
    await client.query("COMMIT");

    client.release();
    clientReleased = true;

    await createAuditLog({
      userId: req.user.id,
      action: "REFUND_CREATED",
      entityType: "refund",
      entityId: refund.id,
      newValues: {
        payment_id: refund.payment_id,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reason: refund.reason,
        reference: refund.reference,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Refund request created",
      refund: refundResult.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create refund error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create refund",
    });
  } finally {
     if (!clientReleased) {
        client.release();
     }
  }
};
const processRefund = async (req, res) => {
  const client = await pool.connect();
  let clientReleased = false;

  try {
    const { refundId } = req.params;

    await client.query("BEGIN");

    // 1. Lock refund
    const refundResult = await client.query(
      `SELECT
         r.id,
         r.payment_id,
         r.amount,
         r.currency,
         r.status,
         r.reference,
         p.merchant_id,
         p.customer_id
       FROM refunds r
       JOIN payments p
         ON r.payment_id = p.id
       WHERE r.id = $1
       FOR UPDATE`,
      [refundId]
    );

    if (refundResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    const refund = refundResult.rows[0];

    // 2. Only pending refunds can be processed
    if (refund.status !== "pending") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: `Refund cannot be processed from status: ${refund.status}`,
      });
    }

    // 3. Make sure requester is the customer or merchant
    const requesterResult = await client.query(
      `SELECT id
       FROM merchants
       WHERE id = $1
         AND user_id = $2`,
      [refund.merchant_id, req.user.id]
    );

    const isMerchant = requesterResult.rows.length > 0;
    const isCustomer = refund.customer_id === req.user.id;

    if (!isMerchant && !isCustomer) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "You are not allowed to process this refund",
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
      [refund.customer_id]
    );

    if (walletResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Customer wallet not found",
      });
    }

    const wallet = walletResult.rows[0];

    if (wallet.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Customer wallet is not active",
      });
    }

    if (wallet.currency !== refund.currency) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Refund currency does not match wallet currency",
      });
    }

    // 5. Lock merchant account
    const merchantAccountResult = await client.query(
      `SELECT
         id,
         merchant_id,
         available_balance,
         settlement_currency,
         status
       FROM merchant_accounts
       WHERE merchant_id = $1
       FOR UPDATE`,
      [refund.merchant_id]
    );

    if (merchantAccountResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Merchant account not found",
      });
    }

    const merchantAccount = merchantAccountResult.rows[0];

    if (merchantAccount.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Merchant account is not active",
      });
    }

    if (merchantAccount.settlement_currency !== refund.currency) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Refund currency does not match merchant account currency",
      });
    }

    // 6. Check merchant has enough balance to refund
    if (
      Number(merchantAccount.available_balance) <
      Number(refund.amount)
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Merchant has insufficient balance for refund",
      });
    }

    // 7. Debit merchant account
    const updatedMerchantAccount = await client.query(
      `UPDATE merchant_accounts
       SET available_balance = available_balance - $1
       WHERE id = $2
       RETURNING
         id,
         merchant_id,
         account_number,
         settlement_currency,
         available_balance,
         pending_balance,
         status`,
      [refund.amount, merchantAccount.id]
    );

    // 8. Credit customer wallet
    const updatedWallet = await client.query(
      `UPDATE wallets
       SET balance = balance + $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING
         id,
         user_id,
         balance,
         currency,
         status,
         updated_at`,
      [refund.amount, wallet.id]
    );

    // 9. Create refund transaction
    const transactionReference = `REF-TXN-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    const transactionResult = await client.query(
      `INSERT INTO transactions
       (
         wallet_id,
         type,
         amount,
         currency,
         status,
         reference
       )
       VALUES ($1, 'refund', $2, $3, 'completed', $4)
       RETURNING
         id,
         wallet_id,
         type,
         amount,
         currency,
         status,
         reference,
         created_at`,
      [
        wallet.id,
        refund.amount,
        refund.currency,
        transactionReference,
      ]
    );

    const transaction = transactionResult.rows[0];

    // 10. Create customer credit ledger entry
    await client.query(
      `INSERT INTO ledger_entries
       (
         transaction_id,
         wallet_id,
         entry_type,
         amount,
         currency,
         description
       )
       VALUES ($1, $2, 'credit', $3, $4, $5)`,
      [
        transaction.id,
        wallet.id,
        refund.amount,
        refund.currency,
        "Refund received",
      ]
    );

    // 11. Mark refund completed
    const completedRefund = await client.query(
      `UPDATE refunds
       SET status = 'completed',
           updated_at = NOW()
       WHERE id = $1
       RETURNING
         id,
         payment_id,
         amount,
         currency,
         status,
         reference,
         reason,
         created_at,
         updated_at`,
      [refund.id]
    );

     await client.query("COMMIT");

    client.release();
    clientReleased = true;

    await createAuditLog({
      userId: req.user.id,
      action: "REFUND_COMPLETED",
      entityType: "refund",
      entityId: refund.id,
      oldValues: {
        status: "processing",
      },
      newValues: {
        status: "completed",
        amount: refund.amount,
        currency: refund.currency,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      success: true,
      message: "Refund processed successfully",
      refund: completedRefund.rows[0],
      transaction,
      customerWallet: updatedWallet.rows[0],
      merchantAccount: updatedMerchantAccount.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Process refund error:", error);

    res.status(500).json({
      success: false,
      message: "Refund processing failed",
    });
  } finally {
     if (!clientReleased) {
        client.release();
    }
  }
};

module.exports = {
  createRefund,
  processRefund,
};