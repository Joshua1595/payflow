const pool = require("../config/db");

const reconcileSettlements = async (merchantId) => {
  const client = await pool.connect();

  try {
    // Get merchant account
    const accountResult = await client.query(
      `SELECT
          id,
          merchant_id,
          available_balance,
          pending_balance,
          settlement_currency,
          status
       FROM merchant_accounts
       WHERE merchant_id = $1`,
      [merchantId]
    );

    if (accountResult.rows.length === 0) {
      return {
        success: false,
        message: "Merchant account not found",
      };
    }

    const account = accountResult.rows[0];

    // Completed settlements
    const completedResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM settlements
       WHERE merchant_id = $1
         AND status = 'completed'`,
      [merchantId]
    );

    // Pending settlements
    const pendingResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM settlements
       WHERE merchant_id = $1
         AND status = 'pending'`,
      [merchantId]
    );

    const completedSettlements = Number(
      completedResult.rows[0].total
    );

    const pendingSettlements = Number(
      pendingResult.rows[0].total
    );

    const availableBalance = Number(
      account.available_balance
    );

    const pendingBalance = Number(
      account.pending_balance
    );

    const pendingDifference =
      pendingBalance - pendingSettlements;

    // Completed payments
    const paymentsResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM payments
       WHERE merchant_id = $1
         AND status = 'completed'`,
      [merchantId]
    );

    // Completed refunds
    const refundsResult = await client.query(
      `SELECT COALESCE(SUM(r.amount), 0) AS total
       FROM refunds r
       INNER JOIN payments p
         ON p.id = r.payment_id
       WHERE p.merchant_id = $1
         AND r.status = 'completed'`,
      [merchantId]
    );

    const totalPayments = Number(
      paymentsResult.rows[0].total
    );

    const totalRefunds = Number(
      refundsResult.rows[0].total
    );

    // Money earned by merchant before settlements
    const netMerchantFunds =
      totalPayments - totalRefunds;

    // Expected available balance after completed settlements
    const expectedAvailableBalance =
      netMerchantFunds - completedSettlements - pendingSettlements;

    const availableDifference =
      availableBalance - expectedAvailableBalance;

    const balanced =
      pendingDifference === 0 &&
      Math.abs(availableDifference) < 0.01;

    return {
      success: true,

      merchantId,
      merchantAccountId: account.id,
      currency: account.settlement_currency,

      totalPayments,
      totalRefunds,
      netMerchantFunds,

      completedSettlements,
      pendingSettlements,

      availableBalance,
      expectedAvailableBalance,

      pendingBalance,
      expectedPendingBalance: pendingSettlements,

      availableDifference,
      pendingDifference,

      balanced,
    };
  } finally {
    client.release();
  }
};

module.exports = {
  reconcileSettlements,
};