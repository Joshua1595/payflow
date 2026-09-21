const pool = require("../config/db");

const getLedger = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         le.id,
         le.transaction_id,
         le.wallet_id,
         le.entry_type,
         le.amount,
         le.currency,
         le.description,
         le.created_at
       FROM ledger_entries le
       JOIN wallets w
         ON le.wallet_id = w.id
       WHERE w.user_id = $1
       ORDER BY le.created_at DESC`,
      [req.user.id]
    );

    res.status(200).json({
      success: true,
      count: result.rows.length,
      ledger: result.rows,
    });
  } catch (error) {
    console.error("Get ledger error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get ledger",
    });
  }
};
const verifyLedger = async (req, res) => {
  try {
    // Get wallet
    const walletResult = await pool.query(
      `SELECT id, balance, currency, status
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

    const wallet = walletResult.rows[0];

    // Calculate ledger totals
    const ledgerResult = await pool.query(
      `SELECT
         COALESCE(
           SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END),
           0
         ) AS total_credits,

         COALESCE(
           SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END),
           0
         ) AS total_debits

       FROM ledger_entries
       WHERE wallet_id = $1`,
      [wallet.id]
    );

    const totalCredits = Number(ledgerResult.rows[0].total_credits);
    const totalDebits = Number(ledgerResult.rows[0].total_debits);

    const ledgerBalance = totalCredits - totalDebits;
    const walletBalance = Number(wallet.balance);

    const isBalanced = ledgerBalance === walletBalance;

    res.status(200).json({
      success: true,
      wallet: {
        id: wallet.id,
        balance: wallet.balance,
        currency: wallet.currency,
        status: wallet.status,
      },
      ledger: {
        totalCredits,
        totalDebits,
        balance: ledgerBalance,
      },
      verification: {
        isBalanced,
        message: isBalanced
          ? "Wallet balance matches ledger balance"
          : "Wallet balance does not match ledger balance",
      },
    });
  } catch (error) {
    console.error("Verify ledger error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to verify ledger",
    });
  }
};

module.exports = {
  getLedger,
  verifyLedger,
};