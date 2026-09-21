const pool = require("../config/db");

const createSettlement = async (merchantId, amount) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock merchant account
    const accountResult = await client.query(
      `SELECT id, merchant_id, available_balance,
              settlement_currency, status
       FROM merchant_accounts
       WHERE merchant_id = $1
       FOR UPDATE`,
      [merchantId]
    );

    if (accountResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        status: 404,
        message: "Merchant account not found",
      };
    }

    const account = accountResult.rows[0];

    if (account.status !== "active") {
      await client.query("ROLLBACK");
      return {
        success: false,
        status: 400,
        message: "Merchant account is not active",
      };
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        status: 400,
        message: "Settlement amount must be a positive number",
      };
    }

    if (Number(account.available_balance) < numericAmount) {
      await client.query("ROLLBACK");
      return {
        success: false,
        status: 400,
        message: "Insufficient merchant balance",
      };
    }

    const reference = `STL-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    // Reserve the settlement amount
    const updatedAccount = await client.query(
        `UPDATE merchant_accounts
        SET available_balance = available_balance - $1,
            pending_balance = pending_balance + $1,
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, merchant_id, available_balance,
                    pending_balance, settlement_currency, status`,
        [numericAmount, account.id]
    );

    // Create settlement
    const settlement = await client.query(
      `INSERT INTO settlements
       (
         merchant_id,
         merchant_account_id,
         amount,
         currency,
         status,
         reference
       )
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING *`,
      [
        merchantId,
        account.id,
        numericAmount,
        account.settlement_currency,
        reference,
      ]
    );

    await client.query("COMMIT");

    return {
      success: true,
      settlement: settlement.rows[0],
      merchantAccount: updatedAccount.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
const processSettlement = async (settlementId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock settlement
    const settlementResult = await client.query(
      `SELECT
          id,
          merchant_id,
          merchant_account_id,
          amount,
          currency,
          status,
          reference
       FROM settlements
       WHERE id = $1
       FOR UPDATE`,
      [settlementId]
    );

    if (settlementResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return {
        success: false,
        status: 404,
        message: "Settlement not found",
      };
    }

    const settlement = settlementResult.rows[0];

    if (settlement.status !== "pending") {
      await client.query("ROLLBACK");

      return {
        success: false,
        status: 400,
        message: `Settlement cannot be processed from status: ${settlement.status}`,
      };
    }

    // Lock merchant account
    const accountResult = await client.query(
      `SELECT
          id,
          merchant_id,
          available_balance,
          pending_balance,
          settlement_currency,
          status
       FROM merchant_accounts
       WHERE id = $1
       FOR UPDATE`,
      [settlement.merchant_account_id]
    );

    if (accountResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return {
        success: false,
        status: 404,
        message: "Merchant account not found",
      };
    }

    const account = accountResult.rows[0];

    if (account.status !== "active") {
      await client.query("ROLLBACK");

      return {
        success: false,
        status: 400,
        message: "Merchant account is not active",
      };
    }

    // Check pending balance
    if (Number(account.pending_balance) < Number(settlement.amount)) {
      await client.query("ROLLBACK");

      return {
        success: false,
        status: 400,
        message: "Insufficient pending settlement balance",
      };
    }

    // Move settlement to processing
    await client.query(
      `UPDATE settlements
       SET status = 'processing',
           updated_at = NOW()
       WHERE id = $1`,
      [settlement.id]
    );

    /*
     * Simulate successful payout.
     *
     * In a real payment system this is where we would call
     * a bank/payment provider.
     */

    const completedSettlement = await client.query(
      `UPDATE settlements
       SET status = 'completed',
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [settlement.id]
    );

    // Remove settled amount from pending balance
    const updatedAccount = await client.query(
      `UPDATE merchant_accounts
       SET pending_balance = pending_balance - $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING
          id,
          merchant_id,
          available_balance,
          pending_balance,
          settlement_currency,
          status`,
      [settlement.amount, account.id]
    );

    await client.query("COMMIT");

    return {
      success: true,
      settlement: completedSettlement.rows[0],
      merchantAccount: updatedAccount.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
const failSettlement = async (settlementId, failureReason) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const settlementResult = await client.query(
      `SELECT
          id,
          merchant_id,
          merchant_account_id,
          amount,
          currency,
          status,
          reference
       FROM settlements
       WHERE id = $1
       FOR UPDATE`,
      [settlementId]
    );

    if (settlementResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return {
        success: false,
        status: 404,
        message: "Settlement not found",
      };
    }

    const settlement = settlementResult.rows[0];

    if (settlement.status !== "pending") {
      await client.query("ROLLBACK");

      return {
        success: false,
        status: 400,
        message: `Settlement cannot be failed from status: ${settlement.status}`,
      };
    }

    const accountResult = await client.query(
      `SELECT
          id,
          merchant_id,
          available_balance,
          pending_balance,
          settlement_currency,
          status
       FROM merchant_accounts
       WHERE id = $1
       FOR UPDATE`,
      [settlement.merchant_account_id]
    );

    if (accountResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return {
        success: false,
        status: 404,
        message: "Merchant account not found",
      };
    }

    const account = accountResult.rows[0];

    if (
      Number(account.pending_balance) <
      Number(settlement.amount)
    ) {
      await client.query("ROLLBACK");

      return {
        success: false,
        status: 400,
        message: "Insufficient pending settlement balance",
      };
    }

    // Return the money to available balance
    const updatedAccount = await client.query(
      `UPDATE merchant_accounts
       SET available_balance = available_balance + $1,
           pending_balance = pending_balance - $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING
          id,
          merchant_id,
          available_balance,
          pending_balance,
          settlement_currency,
          status`,
      [settlement.amount, account.id]
    );

    const failedSettlement = await client.query(
      `UPDATE settlements
       SET status = 'failed',
           failure_reason = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [
        failureReason || "Settlement payout failed",
        settlement.id,
      ]
    );

    await client.query("COMMIT");

    return {
      success: true,
      settlement: failedSettlement.rows[0],
      merchantAccount: updatedAccount.rows[0],
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createSettlement,
  processSettlement,
  failSettlement,
};