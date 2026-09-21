const pool = require("../config/db");
const { createSettlement , processSettlement,failSettlement} = require("../services/settlementService");
const { createAuditLog } = require("../services/auditService");
const requestSettlement = async (req, res) => {
  try {
    // Find the merchant owned by the logged-in user
    const merchantResult = await pool.query(
      `SELECT id, business_name, status
       FROM merchants
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (merchantResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Merchant account not found for this user",
      });
    }

    const merchant = merchantResult.rows[0];

    if (merchant.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Merchant account is not active",
      });
    }

    const { amount } = req.body;

    const result = await createSettlement(
      merchant.id,
      amount
    );

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }
    await createAuditLog({
        userId: req.user.id,
        action: "SETTLEMENT_CREATED",
        entityType: "settlement",
        entityId: result.settlement.id,
        newValues: {
            amount: result.settlement.amount,
            currency: result.settlement.currency,
            status: result.settlement.status,
            reference: result.settlement.reference,
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });

    return res.status(201).json({
      success: true,
      message: "Settlement created successfully",
      settlement: result.settlement,
      merchantAccount: result.merchantAccount,
    });
  } catch (error) {
    console.error("Create settlement error:", error);

    return res.status(500).json({
      success: false,
      message: "Settlement creation failed",
    });
  }
};
const processSettlementRequest = async (req, res) => {
  try {
    const { settlementId } = req.params;

    // Verify the settlement belongs to the logged-in merchant
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

    // Check ownership
    const ownershipResult = await pool.query(
      `SELECT id
       FROM settlements
       WHERE id = $1
         AND merchant_id = $2`,
      [settlementId, merchantId]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    const result = await processSettlement(settlementId);

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }
    await createAuditLog({
        userId: req.user.id,
        action: "SETTLEMENT_COMPLETED",
        entityType: "settlement",
        entityId: result.settlement.id,
        oldValues: {
            status: "pending",
        },
        newValues: {
            status: "completed",
            amount: result.settlement.amount,
            currency: result.settlement.currency,
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Settlement processed successfully",
      settlement: result.settlement,
      merchantAccount: result.merchantAccount,
    });
  } catch (error) {
    console.error("Process settlement error:", error);

    return res.status(500).json({
      success: false,
      message: "Settlement processing failed",
    });
  }
};
const failSettlementRequest = async (req, res) => {
  try {
    const { settlementId } = req.params;
    const { reason } = req.body;

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

    const ownershipResult = await pool.query(
      `SELECT id
       FROM settlements
       WHERE id = $1
         AND merchant_id = $2`,
      [settlementId, merchantId]
    );

    if (ownershipResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Settlement not found",
      });
    }

    const result = await failSettlement(
      settlementId,
      reason
    );

    if (!result.success) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }
    await createAuditLog({
        userId: req.user.id,
        action: "SETTLEMENT_FAILED",
        entityType: "settlement",
        entityId: result.settlement.id,
        oldValues: {
            status: "pending",
        },
        newValues: {
            status: "failed",
            amount: result.settlement.amount,
            currency: result.settlement.currency,
            failure_reason: result.settlement.failure_reason,
        },
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    });

    return res.status(200).json({
      success: true,
      message: "Settlement failed and funds returned",
      settlement: result.settlement,
      merchantAccount: result.merchantAccount,
    });
  } catch (error) {
    console.error("Fail settlement error:", error);

    return res.status(500).json({
      success: false,
      message: "Settlement failure processing failed",
    });
  }
};
const getSettlementHistory = async (req, res) => {
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
        message: "Merchant account not found for this user",
      });
    }

    const merchantId = merchantResult.rows[0].id;

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
       WHERE merchant_id = $1
       ORDER BY created_at DESC`,
      [merchantId]
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      settlements: result.rows,
    });
  } catch (error) {
    console.error("Get settlement history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve settlement history",
    });
  }
};

module.exports = {
  requestSettlement,
  processSettlementRequest,
  failSettlementRequest,
  getSettlementHistory,
};

 