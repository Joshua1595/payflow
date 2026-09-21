const pool = require("../config/db");

const getCustomerRefundDetails = async (req, res) => {
  try {
    const { refundId } = req.params;

    const result = await pool.query(
      `SELECT
          r.id,
          r.payment_id,
          r.amount,
          r.currency,
          r.status,
          r.reference,
          r.reason,
          r.created_at,
          r.updated_at,
          p.merchant_id,
          m.business_name
       FROM refunds r
       INNER JOIN payments p
         ON p.id = r.payment_id
       INNER JOIN merchants m
         ON m.id = p.merchant_id
       WHERE r.id = $1
         AND p.customer_id = $2`,
      [refundId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Refund not found",
      });
    }

    const refund = result.rows[0];

    return res.status(200).json({
      success: true,
      refund: {
        id: refund.id,
        payment_id: refund.payment_id,
        merchant_id: refund.merchant_id,
        merchant_name: refund.business_name,
        amount: refund.amount,
        currency: refund.currency,
        status: refund.status,
        reference: refund.reference,
        reason: refund.reason,
        created_at: refund.created_at,
        updated_at: refund.updated_at,
      },
    });
  } catch (error) {
    console.error("Customer refund details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve refund details",
    });
  }
};

module.exports = {
  getCustomerRefundDetails,
};