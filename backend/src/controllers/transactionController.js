const pool = require("../config/db");

const getTransactions = async (req, res) => {
  try {
    const { type, status, from, to } = req.query;

    // Pagination
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit) || 10, 1),
      100
    );

    const offset = (page - 1) * limit;

    const allowedTypes = [
      "deposit",
      "withdrawal",
      "transfer",
      "payment",
      "refund",
    ];

    const allowedStatuses = [
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled",
      "refunded",
    ];

    // Validate transaction type
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction type",
      });
    }

    // Validate transaction status
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction status",
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (from && !dateRegex.test(from)) {
      return res.status(400).json({
        success: false,
        message: "Invalid from date. Use YYYY-MM-DD",
      });
    }

    if (to && !dateRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid to date. Use YYYY-MM-DD",
      });
    }

    if (from && to && from > to) {
      return res.status(400).json({
        success: false,
        message: "from date cannot be after to date",
      });
    }

    // Build WHERE conditions
    const conditions = ["w.user_id = $1"];
    const values = [req.user.id];
    let parameterIndex = 2;

    if (type) {
      conditions.push(`t.type = $${parameterIndex}`);
      values.push(type);
      parameterIndex++;
    }

    if (status) {
      conditions.push(`t.status = $${parameterIndex}`);
      values.push(status);
      parameterIndex++;
    }

    if (from) {
      conditions.push(`t.created_at >= $${parameterIndex}`);
      values.push(from);
      parameterIndex++;
    }

    if (to) {
      conditions.push(
        `t.created_at < ($${parameterIndex}::date + INTERVAL '1 day')`
      );
      values.push(to);
      parameterIndex++;
    }

    const whereClause = conditions.join(" AND ");

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM transactions t
       JOIN wallets w
         ON t.wallet_id = w.id
       WHERE ${whereClause}`,
      values
    );

    const total = Number(countResult.rows[0].total);

    // Get paginated transactions
    const transactionResult = await pool.query(
      `SELECT
         t.id,
         t.wallet_id,
         t.type,
         t.amount,
         t.currency,
         t.status,
         t.reference,
         t.created_at
       FROM transactions t
       JOIN wallets w
         ON t.wallet_id = w.id
       WHERE ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT $${parameterIndex}
       OFFSET $${parameterIndex + 1}`,
      [...values, limit, offset]
    );

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      filters: {
        type: type || null,
        status: status || null,
        from: from || null,
        to: to || null,
      },
      transactions: transactionResult.rows,
    });
  } catch (error) {
    console.error("Get transactions error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get transactions",
    });
  }
};
const getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const result = await pool.query(
      `SELECT
         t.id,
         t.wallet_id,
         t.type,
         t.amount,
         t.currency,
         t.status,
         t.reference,
         t.created_at
       FROM transactions t
       JOIN wallets w
         ON t.wallet_id = w.id
       WHERE t.id = $1
         AND w.user_id = $2`,
      [transactionId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.status(200).json({
      success: true,
      transaction: result.rows[0],
    });
  } catch (error) {
    console.error("Get transaction error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get transaction",
    });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
};