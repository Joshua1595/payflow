const pool = require("../config/db");

const getCustomerDashboard = async (req, res) => {
  try {
    const walletResult = await pool.query(
      `SELECT
          id,
          balance,
          currency,
          status,
          updated_at
       FROM wallets
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer wallet not found",
      });
    }

    const wallet = walletResult.rows[0];

    const paymentStats = await pool.query(
      `SELECT
          COUNT(*) AS total_payments,
          COUNT(*) FILTER (
            WHERE status = 'completed'
          ) AS successful_payments,
          COUNT(*) FILTER (
            WHERE status = 'failed'
          ) AS failed_payments,
          COALESCE(
            SUM(amount) FILTER (
              WHERE status = 'completed'
            ),
            0
          ) AS total_spent
       FROM payments
       WHERE customer_id = $1`,
      [req.user.id]
    );

    const refundStats = await pool.query(
      `SELECT
          COUNT(*) AS total_refunds,
          COALESCE(
            SUM(r.amount) FILTER (
              WHERE r.status = 'completed'
            ),
            0
          ) AS total_refunded
       FROM refunds r
       INNER JOIN payments p
         ON p.id = r.payment_id
       WHERE p.customer_id = $1`,
      [req.user.id]
    );

    const transferStats = await pool.query(
      `SELECT
          COUNT(*) AS total_transfers,
          COALESCE(
            SUM(amount),
            0
          ) AS total_transferred
       FROM wallet_transfers wt
       INNER JOIN wallets w
         ON w.id = wt.sender_wallet_id
       WHERE w.user_id = $1`,
      [req.user.id]
    );

    return res.status(200).json({
      success: true,

      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
        updated_at: wallet.updated_at,
      },

      payments: {
        total: Number(
          paymentStats.rows[0].total_payments
        ),
        successful: Number(
          paymentStats.rows[0].successful_payments
        ),
        failed: Number(
          paymentStats.rows[0].failed_payments
        ),
        total_spent: paymentStats.rows[0].total_spent,
      },

      refunds: {
        total: Number(
          refundStats.rows[0].total_refunds
        ),
        total_refunded:
          refundStats.rows[0].total_refunded,
      },

      transfers: {
        total: Number(
          transferStats.rows[0].total_transfers
        ),
        total_transferred:
          transferStats.rows[0].total_transferred,
      },
    });
  } catch (error) {
    console.error("Customer dashboard error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load customer dashboard",
    });
  }
};

module.exports = {
  getCustomerDashboard,
};