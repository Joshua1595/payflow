const pool = require("../config/db");

const getAuditHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
          id,
          user_id,
          action,
          entity_type,
          entity_id,
          old_values,
          new_values,
          ip_address,
          user_agent,
          created_at
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      auditLogs: result.rows,
    });
  } catch (error) {
    console.error("Get audit history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve audit history",
    });
  }
};

module.exports = {
  getAuditHistory,
};