const pool = require("../config/db");

const getCustomerTransactions = async (req, res) => {
  try {
    const customerId = req.user.id;

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const offset = (page - 1) * limit;

    const { type, status } = req.query;

    const params = [customerId];

    let whereClause = `
      WHERE t.wallet_id = (
        SELECT id
        FROM wallets
        WHERE user_id = $1
      )
    `;

    if (type) {
      params.push(type);
      whereClause += ` AND t.type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND t.status = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM transactions t
       ${whereClause}`,
      params
    );

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT
          t.id,
          t.wallet_id,
          t.payment_id,
          t.type,
          t.amount,
          t.currency,
          t.status,
          t.reference,
          t.created_at
       FROM transactions t
       ${whereClause}
       ORDER BY t.created_at DESC
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
      transactions: result.rows,
    });
  } catch (error) {
    console.error("Customer transaction history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer transactions",
    });
  }
};

module.exports = {
  getCustomerTransactions,
};