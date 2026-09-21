
const pool = require("../config/db");

const getCustomerActivity = async (req, res) => {
  try {
    const customerId = req.user.id;

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      100
    );

    const offset = (page - 1) * limit;

    // Get total number of activities
    const countResult = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM (
        -- Payments
        SELECT p.id
        FROM payments p
        WHERE p.customer_id = $1

        UNION ALL

        -- Refunds
        SELECT r.id
        FROM refunds r
        INNER JOIN payments p
          ON p.id = r.payment_id
        WHERE p.customer_id = $1

        UNION ALL

        -- Transfers
        SELECT wt.id
        FROM wallet_transfers wt
        INNER JOIN wallets w
          ON (
            w.id = wt.sender_wallet_id
            OR w.id = wt.receiver_wallet_id
          )
        WHERE w.user_id = $1
      ) activity_count
      `,
      [customerId]
    );

    const total = Number(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Get activities for current page
    const result = await pool.query(
      `
      SELECT *
      FROM (
        -- Payments
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
        WHERE p.customer_id = $1

        UNION ALL

        -- Refunds
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
        WHERE p.customer_id = $1

        UNION ALL

        -- Transfers
        SELECT
          wt.id AS entity_id,
          'wallet_transfer' AS entity_type,
          'TRANSFER' AS activity_type,
          wt.status,
          wt.amount,
          w.currency,
          wt.reference,
          wt.created_at
        FROM wallet_transfers wt
        INNER JOIN wallets w
          ON (
            w.id = wt.sender_wallet_id
            OR w.id = wt.receiver_wallet_id
          )
        WHERE w.user_id = $1
      ) activity
      ORDER BY created_at DESC
      LIMIT $2
      OFFSET $3
      `,
      [customerId, limit, offset]
    );

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages,
      activities: result.rows,
    });
  } catch (error) {
    console.error("Customer activity error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer activity",
    });
  }
};

module.exports = {
  getCustomerActivity,
};

