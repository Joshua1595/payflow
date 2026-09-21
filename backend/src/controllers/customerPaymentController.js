const pool = require("../config/db");

const getCustomerPayments = async (req, res) => {
  try {
    const customerId = req.user.id;

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const offset = (page - 1) * limit;

    const { status } = req.query;

    const params = [customerId];

    let whereClause = `WHERE p.customer_id = $1`;

    if (status) {
      params.push(status);
      whereClause += ` AND p.status = $${params.length}`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM payments p
       ${whereClause}`,
      params
    );

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT
          p.id,
          p.merchant_id,
          p.amount,
          p.currency,
          p.status,
          p.reference,
          p.created_at
       FROM payments p
       ${whereClause}
       ORDER BY p.created_at DESC
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
      payments: result.rows,
    });
  } catch (error) {
    console.error("Customer payment history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer payments",
    });
  }
};

module.exports = {
  getCustomerPayments,
};