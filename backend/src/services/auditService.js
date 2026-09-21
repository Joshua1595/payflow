const pool = require("../config/db");

const createAuditLog = async ({
  userId = null,
  action,
  entityType = null,
  entityId = null,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    const result = await pool.query(
      `INSERT INTO audit_logs
       (
         user_id,
         action,
         entity_type,
         entity_id,
         old_values,
         new_values,
         ip_address,
         user_agent
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        action,
        entityType,
        entityId,
        oldValues,
        newValues,
        ipAddress,
        userAgent,
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Create audit log error:", error);
    throw error;
  }
};

module.exports = {
  createAuditLog,
};