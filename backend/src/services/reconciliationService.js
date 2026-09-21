const reconcileWallet = async (client, walletId) => {
  const walletResult = await client.query(
    `SELECT id, user_id, balance, currency, status
     FROM wallets
     WHERE id = $1`,
    [walletId]
  );

  if (walletResult.rows.length === 0) {
    return {
      exists: false,
      isBalanced: false,
      message: "Wallet not found",
    };
  }

  const wallet = walletResult.rows[0];

  const ledgerResult = await client.query(
    `SELECT
       COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE 0 END), 0) AS total_credits,
       COALESCE(SUM(CASE WHEN entry_type = 'debit' THEN amount ELSE 0 END), 0) AS total_debits
     FROM ledger_entries
     WHERE wallet_id = $1`,
    [walletId]
  );

  const totalCredits = Number(ledgerResult.rows[0].total_credits);
  const totalDebits = Number(ledgerResult.rows[0].total_debits);

  const ledgerBalance = totalCredits - totalDebits;
  const walletBalance = Number(wallet.balance);

  return {
    exists: true,
    walletId: wallet.id,
    userId: wallet.user_id,
    currency: wallet.currency,
    walletBalance,
    totalCredits,
    totalDebits,
    ledgerBalance,
    difference: walletBalance - ledgerBalance,
    isBalanced:
      Math.abs(walletBalance - ledgerBalance) < 0.01,
  };
};

const reconcileMerchant = async (client, merchantId) => {
  const accountResult = await client.query(
    `SELECT
       id,
       merchant_id,
       account_number,
       settlement_currency,
       available_balance,
       pending_balance,
       status
     FROM merchant_accounts
     WHERE merchant_id = $1`,
    [merchantId]
  );

  if (accountResult.rows.length === 0) {
    return {
      exists: false,
      isBalanced: false,
      message: "Merchant account not found",
    };
  }

  const account = accountResult.rows[0];

  const paymentsResult = await client.query(
    `SELECT
       COALESCE(SUM(amount), 0) AS total_payments
     FROM payments
     WHERE merchant_id = $1
       AND status = 'completed'`,
    [merchantId]
  );

  const refundsResult = await client.query(
    `SELECT
       COALESCE(SUM(r.amount), 0) AS total_refunds
     FROM refunds r
     INNER JOIN payments p
       ON p.id = r.payment_id
     WHERE p.merchant_id = $1
       AND r.status = 'completed'`,
    [merchantId]
  );

  const totalPayments = Number(
    paymentsResult.rows[0].total_payments
  );

  const totalRefunds = Number(
    refundsResult.rows[0].total_refunds
  );

  const expectedBalance = totalPayments - totalRefunds;
  const availableBalance = Number(account.available_balance);

  return {
    exists: true,
    merchantId,
    accountId: account.id,
    accountNumber: account.account_number,
    currency: account.settlement_currency,
    availableBalance,
    totalPayments,
    totalRefunds,
    expectedBalance,
    difference: availableBalance - expectedBalance,
    isBalanced:
      Math.abs(availableBalance - expectedBalance) < 0.01,
  };
};
const reconcilePayments = async (client, merchantId = null) => {
  const queryParams = [];
  let merchantFilter = "";

  if (merchantId) {
    queryParams.push(merchantId);
    merchantFilter = `AND p.merchant_id = $1`;
  }

  const paymentsResult = await client.query(
    `SELECT
       p.id,
       p.merchant_id,
       p.amount,
       p.currency,
       p.status,
       p.reference,

       t.id AS transaction_id,
       t.amount AS transaction_amount,
       t.currency AS transaction_currency,
       t.status AS transaction_status,
       t.type AS transaction_type

     FROM payments p

     LEFT JOIN transactions t
       ON t.payment_id = p.id

     WHERE p.status = 'completed'
       ${merchantFilter}

     ORDER BY p.created_at DESC`,
    queryParams
  );

  const payments = paymentsResult.rows.map((row) => {
    const paymentAmount = Number(row.amount);
    const transactionAmount =
      row.transaction_amount !== null
        ? Number(row.transaction_amount)
        : null;

    const hasTransaction = row.transaction_id !== null;

    const amountMatches =
      hasTransaction &&
      transactionAmount !== null &&
      Math.abs(paymentAmount - transactionAmount) < 0.01;

    const currencyMatches =
      hasTransaction &&
      row.currency === row.transaction_currency;

    const statusMatches =
      hasTransaction &&
      row.transaction_status === "completed";

    const typeMatches =
      hasTransaction &&
      row.transaction_type === "payment";

    const isBalanced =
      hasTransaction &&
      amountMatches &&
      currencyMatches &&
      statusMatches &&
      typeMatches;

    return {
      paymentId: row.id,
      paymentReference: row.reference,
      paymentAmount,
      paymentCurrency: row.currency,
      paymentStatus: row.status,

      transactionId: row.transaction_id,
      transactionAmount,
      transactionCurrency: row.transaction_currency,
      transactionStatus: row.transaction_status,
      transactionType: row.transaction_type,

      transactionFound: hasTransaction,
      amountMatches,
      currencyMatches,
      statusMatches,
      typeMatches,
      isBalanced,
    };
  });

  const matchedPayments = payments.filter(
    (payment) => payment.isBalanced
  ).length;

  const mismatches = payments.filter(
    (payment) => !payment.isBalanced
  );

  return {
    totalCompletedPayments: payments.length,
    matchedPayments,
    mismatchedPayments: mismatches.length,
    isBalanced: mismatches.length === 0,
    payments,
    mismatches,
  };
};

module.exports = {
  reconcileWallet,
  reconcileMerchant,
  reconcilePayments,
};

