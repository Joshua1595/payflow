const pool = require("../config/db");

const getMerchantDashboard = async (req, res) => {
  try {
    const merchantResult = await pool.query(
      `SELECT
          id,
          business_name,
          status
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

    const merchant = merchantResult.rows[0];

    const accountResult = await pool.query(
      `SELECT
          id,
          account_number,
          available_balance,
          pending_balance,
          settlement_currency,
          status
       FROM merchant_accounts
       WHERE merchant_id = $1`,
      [merchant.id]
    );

    if (accountResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Merchant account not found",
      });
    }

    const account = accountResult.rows[0];

    const paymentStats = await pool.query(
      `SELECT
          COUNT(*) AS total_payments,
          COUNT(*) FILTER (WHERE status = 'completed') AS successful_payments,
          COUNT(*) FILTER (WHERE status = 'failed') AS failed_payments,
          COALESCE(
            SUM(amount) FILTER (WHERE status = 'completed'),
            0
          ) AS total_sales
       FROM payments
       WHERE merchant_id = $1`,
      [merchant.id]
    );

    const refundStats = await pool.query(
      `SELECT
          COUNT(*) AS total_refunds,
          COALESCE(
            SUM(r.amount) FILTER (WHERE r.status = 'completed'),
            0
          ) AS total_refunded
       FROM refunds r
       INNER JOIN payments p
         ON p.id = r.payment_id
       WHERE p.merchant_id = $1`,
      [merchant.id]
    );

    const settlementStats = await pool.query(
      `SELECT
          COUNT(*) AS total_settlements,
          COUNT(*) FILTER (
            WHERE status = 'completed'
          ) AS completed_settlements,
          COUNT(*) FILTER (
            WHERE status = 'pending'
          ) AS pending_settlements,
          COUNT(*) FILTER (
            WHERE status = 'failed'
          ) AS failed_settlements,
          COALESCE(
            SUM(amount) FILTER (
              WHERE status = 'completed'
            ),
            0
          ) AS total_settled
       FROM settlements
       WHERE merchant_id = $1`,
      [merchant.id]
    );

    return res.status(200).json({
      success: true,

      merchant: {
        id: merchant.id,
        business_name: merchant.business_name,
        status: merchant.status,
      },

      account: {
        id: account.id,
        account_number: account.account_number,
        available_balance: account.available_balance,
        pending_balance: account.pending_balance,
        settlement_currency: account.settlement_currency,
        status: account.status,
      },

      payments: {
        total: Number(paymentStats.rows[0].total_payments),
        successful: Number(
          paymentStats.rows[0].successful_payments
        ),
        failed: Number(
          paymentStats.rows[0].failed_payments
        ),
        total_sales: paymentStats.rows[0].total_sales,
      },

      refunds: {
        total: Number(refundStats.rows[0].total_refunds),
        total_refunded: refundStats.rows[0].total_refunded,
      },

      settlements: {
        total: Number(
          settlementStats.rows[0].total_settlements
        ),
        completed: Number(
          settlementStats.rows[0].completed_settlements
        ),
        pending: Number(
          settlementStats.rows[0].pending_settlements
        ),
        failed: Number(
          settlementStats.rows[0].failed_settlements
        ),
        total_settled: settlementStats.rows[0].total_settled,
      },
    });
  } catch (error) {
    console.error("Merchant dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load merchant dashboard",
    });
  }
};

module.exports = {
  getMerchantDashboard,
};