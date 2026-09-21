const pool = require("../config/db");

const getMerchantPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

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
          m.business_name,
          u.email AS customer_email
       FROM payments p
       INNER JOIN merchants m
         ON m.id = p.merchant_id
       INNER JOIN users u
         ON u.id = p.customer_id
       WHERE p.id = $1
         AND p.merchant_id = (
           SELECT id
           FROM merchants
           WHERE user_id = $2
             AND status = 'active'
         )`,
      [paymentId, req.user.id]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const payment = paymentResult.rows[0];

    const attemptsResult = await pool.query(
      `SELECT
          id,
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

    const refundsResult = await pool.query(
      `SELECT
          id,
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

    return res.status(200).json({
      success: true,
      payment: {
        id: payment.id,
        merchant_id: payment.merchant_id,
        merchant_name: payment.business_name,
        customer_id: payment.customer_id,
        customer_email: payment.customer_email,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        reference: payment.reference,
        created_at: payment.created_at,
      },
      attempts: attemptsResult.rows,
      refunds: refundsResult.rows,
    });
  } catch (error) {
    console.error("Merchant payment details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payment details",
    });
  }
};

module.exports = {
  getMerchantPaymentDetails,
};