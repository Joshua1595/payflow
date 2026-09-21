const pool = require("../config/db");
const {
  reconcileWallet,
  reconcileMerchant,
  reconcilePayments,
} = require("../services/reconciliationService");

const reconcileWalletEndpoint = async (req, res) => {
  const client = await pool.connect();

  try {
    const walletResult = await client.query(
      `SELECT id
       FROM wallets
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const result = await reconcileWallet(
      client,
      walletResult.rows[0].id
    );

    return res.status(200).json({
      success: true,
      reconciliation: result,
    });
  } catch (error) {
    console.error("Wallet reconciliation error:", error);

    return res.status(500).json({
      success: false,
      message: "Wallet reconciliation failed",
    });
  } finally {
    client.release();
  }
};

const reconcileMerchantEndpoint = async (req, res) => {
  const client = await pool.connect();

  try {
    const merchantResult = await client.query(
      `SELECT id
       FROM merchants
       WHERE user_id = $1
         AND status = 'active'`,
      [req.user.id]
    );

    if (merchantResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Active merchant account not found",
      });
    }

    const result = await reconcileMerchant(
      client,
      merchantResult.rows[0].id
    );

    return res.status(200).json({
      success: true,
      reconciliation: result,
    });
  } catch (error) {
    console.error("Merchant reconciliation error:", error);

    return res.status(500).json({
      success: false,
      message: "Merchant reconciliation failed",
    });
  } finally {
    client.release();
  }
};
const reconcilePaymentsEndpoint = async (req, res) => {
  const client = await pool.connect();

  try {
    const merchantResult = await client.query(
      `SELECT id
       FROM merchants
       WHERE user_id = $1
         AND status = 'active'`,
      [req.user.id]
    );

    let merchantId = null;

    if (merchantResult.rows.length > 0) {
      merchantId = merchantResult.rows[0].id;
    }

    const result = await reconcilePayments(
      client,
      merchantId
    );

    return res.status(200).json({
      success: true,
      reconciliation: result,
    });
  } catch (error) {
    console.error(
      "Payment reconciliation error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Payment reconciliation failed",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  reconcileWalletEndpoint,
  reconcileMerchantEndpoint,
 reconcilePaymentsEndpoint,
};