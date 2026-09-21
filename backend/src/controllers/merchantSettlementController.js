const pool = require("../config/db");

const getMerchantSettlements = async (req, res) => {
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

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const offset = (page - 1) * limit;

    const { status } = req.query;

    const params = [merchantId];

    let whereClause = `WHERE merchant_id = $1`;

    if (status) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM settlements
       ${whereClause}`,
      params
    );

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT
          id,
          merchant_id,
          merchant_account_id,
          amount,
          currency,
          status,
          reference,
          failure_reason,
          created_at,
          updated_at,
          completed_at
       FROM settlements
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`,
      params
    );

    const total = Number(countResult.rows[0].total);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      settlements: result.rows,
    });
  } catch (error) {
    console.error("Merchant settlement history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve merchant settlements",
    });
  }
};

module.exports = {
  getMerchantSettlements,
};