const pool = require("../config/db");

const getMerchantActivity = async (req, res) => {
  try {
    const merchantResult = await pool.query(
      `SELECT id
       FROM merchants
       WHERE user_id = $1
         AND status = 'active'`,
      [req.user.id]
    );

    if (merchantResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Merchant account not found",
      });
    }

    const merchantId = merchantResult.rows[0].id;

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const result = await pool.query(
      `
      SELECT *
      FROM (
        SELECT
          p.id AS entity_id,
          'payment' AS entity_type,
          'PAYMENT' AS activity_type,
          p.status,
          p.amount,
          p.currency,
          p.reference,
          p.created_at
        FROM payments p
        WHERE p.merchant_id = $1

        UNION ALL

        SELECT
          r.id AS entity_id,
          'refund' AS entity_type,
          'REFUND' AS activity_type,
          r.status,
          r.amount,
          r.currency,
          r.reference,
          r.created_at
        FROM refunds r
        INNER JOIN payments p
          ON p.id = r.payment_id
        WHERE p.merchant_id = $1

        UNION ALL

        SELECT
          s.id AS entity_id,
          'settlement' AS entity_type,
          'SETTLEMENT' AS activity_type,
          s.status,
          s.amount,
          s.currency,
          s.reference,
          s.created_at
        FROM settlements s
        WHERE s.merchant_id = $1
      ) activity
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [merchantId, limit]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      activities: result.rows,
    });
  } catch (error) {
    console.error("Merchant activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve merchant activity",
    });
  }
};

module.exports = {
  getMerchantActivity,
};