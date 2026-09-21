const pool = require("../config/db");

const getMerchantTransactions = async (req, res) => {
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

    const { type, status } = req.query;

    const params = [merchantId];

    let whereClause = `WHERE 1 = 1`;

    if (type) {
      params.push(type);
      whereClause += ` AND t.type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      whereClause += ` AND t.status = $${params.length}`;
    }

    // Merchant transactions are linked through payment transactions.
    // Refund transactions belong to the customer's wallet, so we
    // identify them through refunds -> payments -> merchant.
    if (type === "payment") {
      whereClause += ` AND p.merchant_id = $1`;
    } else if (type === "refund") {
      whereClause += ` AND rp.merchant_id = $1`;
    } else {
      whereClause += `
        AND (
          p.merchant_id = $1
          OR rp.merchant_id = $1
        )
      `;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM transactions t
       LEFT JOIN payments p
         ON p.id = t.payment_id
       LEFT JOIN refunds r
         ON r.id = (
           SELECT r2.id
           FROM refunds r2
           WHERE r2.id IS NOT NULL
             AND r2.payment_id = t.payment_id
           ORDER BY r2.created_at ASC
           LIMIT 1
         )
       LEFT JOIN payments rp
         ON rp.id = r.payment_id
       ${whereClause}`,
      params
    );

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT
          t.id,
          t.payment_id,
          t.type,
          t.amount,
          t.currency,
          t.status,
          t.reference,
          t.created_at
       FROM transactions t
       LEFT JOIN payments p
         ON p.id = t.payment_id
       LEFT JOIN refunds r
         ON r.id = (
           SELECT r2.id
           FROM refunds r2
           WHERE r2.payment_id = t.payment_id
           ORDER BY r2.created_at ASC
           LIMIT 1
         )
       LEFT JOIN payments rp
         ON rp.id = r.payment_id
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
    console.error("Merchant transaction history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve merchant transactions",
    });
  }
};

module.exports = {
  getMerchantTransactions,
};