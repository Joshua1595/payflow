const pool = require("../config/db");

const getCustomerPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Get payment and verify ownership
    const paymentResult = await pool.query(
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
       INNER JOIN merchants m
         ON m.id = p.merchant_id
       WHERE p.id = $1
         AND p.customer_id = $2`,
      [paymentId, req.user.id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const payment = paymentResult.rows[0];

    // Payment attempts
    const attemptsResult = await pool.query(
      `SELECT
          id,
          payment_id,
          provider,
          provider_transaction_id,
          attempt_number,
          status,
          amount,
          currency,
          error_code,
          error_message,
          created_at
       FROM payment_attempts
       WHERE payment_id = $1
       ORDER BY attempt_number ASC`,
      [paymentId]
    );

    // Refunds
    const refundsResult = await pool.query(
      `SELECT
          id,
          payment_id,
          amount,
          currency,
          status,
          reference,
          reason,
          created_at,
          updated_at
       FROM refunds
       WHERE payment_id = $1
       ORDER BY created_at DESC`,
      [paymentId]
    );

    // Related transaction
    const transactionResult = await pool.query(
    `SELECT
        id,
        wallet_id,
        payment_id,
        type,
        amount,
        currency,
        status,
        reference,
        created_at
    FROM transactions
    WHERE payment_id = $1
    LIMIT 1`,
    [paymentId]
    );

    return res.status(200).json({
      success: true,
      payment: {
        id: payment.id,
        merchant_id: payment.merchant_id,
        merchant_name: payment.business_name,
        customer_id: payment.customer_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        reference: payment.reference,
        created_at: payment.created_at,
      },
      attempts: attemptsResult.rows,
      refunds: refundsResult.rows,
      transaction:
        transactionResult.rows.length > 0
          ? transactionResult.rows[0]
          : null,
    });
  } catch (error) {
    console.error("Customer payment details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payment details",
    });
  }
};

module.exports = {
  getCustomerPaymentDetails,
};