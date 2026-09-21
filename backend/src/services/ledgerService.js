const createLedgerEntries = async (
  client,
  transactionId,
  senderWalletId,
  receiverWalletId,
  amount,
  currency
) => {
  // Debit sender
  await client.query(
    `INSERT INTO ledger_entries
     (transaction_id, wallet_id, entry_type, amount, currency, description)
     VALUES ($1, $2, 'debit', $3, $4, $5)`,
    [
      transactionId,
      senderWalletId,
      amount,
      currency,
      "Transfer sent",
    ]
  );

  // Credit receiver
  await client.query(
    `INSERT INTO ledger_entries
     (transaction_id, wallet_id, entry_type, amount, currency, description)
     VALUES ($1, $2, 'credit', $3, $4, $5)`,
    [
      transactionId,
      receiverWalletId,
      amount,
      currency,
      "Transfer received",
    ]
  );
};

module.exports = {
  createLedgerEntries,
};