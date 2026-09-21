const pool = require("../config/db");

const getMerchantSettlementDetails = async (req, res) => {
  try {
    const { settlementId } = req.params;

    const result = await pool.query(
      `SELECT
          s.id,
          s.merchant_id,
          s.merchant_account_id,
          s.amount,
          s.currency,
          s.status,
          s.reference,
          s.failure_reason,
          s.created_at,
          s.updated_at,
          s.completed_at,
          m.business_name,
          ma.account_number
       FROM settlements s
       INNER JOIN merchants m
         ON m.id = s.merchant_id
       INNER JOIN merchant_accounts ma
         ON ma.id = s.merchant_account_id
       WHERE s.id = $1
         AND s.merchant_id = (
           SELECT id
           FROM merchants
           WHERE user_id = $2
             AND status = 'active'
         )`,
      [settlementId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    const settlement = result.rows[0];

    return res.status(200).json({
      success: true,
      settlement: {
        id: settlement.id,
        merchant_id: settlement.merchant_id,
        merchant_name: settlement.business_name,
        merchant_account_id: settlement.merchant_account_id,
        account_number: settlement.account_number,
        amount: settlement.amount,
        currency: settlement.currency,
        status: settlement.status,
        reference: settlement.reference,
        failure_reason: settlement.failure_reason,
        created_at: settlement.created_at,
        updated_at: settlement.updated_at,
        completed_at: settlement.completed_at,
      },
    });
  } catch (error) {
    console.error("Merchant settlement details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve settlement details",
    });
  }
};

module.exports = {
  getMerchantSettlementDetails,
};