const pool = require("../config/db");
const {
  reconcileSettlements,
} = require("../services/settlementReconciliationService");

const getSettlementReconciliation = async (req, res) => {
  try {
    // Find the merchant belonging to the authenticated user
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
        message: "Merchant account not found for this user",
      });
    }

    const merchantId = merchantResult.rows[0].id;

    const result = await reconcileSettlements(merchantId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Settlement reconciliation error:", error);

    return res.status(500).json({
      success: false,
      message: "Settlement reconciliation failed",
    });
  }
};

module.exports = {
  getSettlementReconciliation,
};