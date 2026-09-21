const pool = require("../config/db");

const getPaymentAttempts = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Make sure the authenticated user owns or receives this payment
    const paymentResult = await pool.query(
      `SELECT
         p.id,
         p.customer_id,
         m.user_id AS merchant_user_id
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

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const result = await pool.query(
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
         created_at,
         updated_at
       FROM payment_attempts
       WHERE payment_id = $1
       ORDER BY attempt_number ASC`,
      [paymentId]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      attempts: result.rows,
    });
  } catch (error) {
    console.error("Get payment attempts error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get payment attempts",
    });
  }
};

module.exports = {
  getPaymentAttempts,
};