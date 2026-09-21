const pool = require("../config/db");
const { createLedgerEntries } = require("../services/ledgerService");
const { createAuditLog } = require("../services/auditService");
const getWallet = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, balance, currency, status, created_at, updated_at
       FROM wallets
       WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    res.status(200).json({
      success: true,
      wallet: result.rows[0],
    });
  } catch (error) {
    console.error("Get wallet error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const depositMoney = async (req, res) => {
  const client = await pool.connect();

  try {
    const { amount } = req.body;

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Deposit amount must be a positive number",
      });
    }

    await client.query("BEGIN");

    // Lock the wallet row
    const walletResult = await client.query(
      `SELECT id, balance, currency, status
       FROM wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [req.user.id]
    );

    if (walletResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const wallet = walletResult.rows[0];

    if (wallet.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Wallet is not active",
      });
    }

    // Update wallet balance
    const updatedWallet = await client.query(
      `UPDATE wallets
       SET balance = balance + $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, user_id, balance, currency, status, updated_at`,
      [numericAmount , wallet.id]
    );

    // Create transaction record
    const reference = `DEP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const transaction = await client.query(
    `INSERT INTO transactions
    (wallet_id, type, amount, currency, status, reference)
    VALUES ($1, 'deposit', $2, $3, 'completed', $4)
    RETURNING id, wallet_id, type, amount, currency, status, reference, created_at`,
    [
        wallet.id,
        numericAmount,
        wallet.currency,
        reference,
    ]
    );
    await client.query(
        `INSERT INTO ledger_entries
        (transaction_id, wallet_id, entry_type, amount, currency, description)
        VALUES ($1, $2, 'credit', $3, $4, $5)`,
        [
            transaction.rows[0].id,
            wallet.id,
            numericAmount,
            wallet.currency,
            "Money deposited",
        ]
    );

    await client.query("COMMIT");
    await createAuditLog({
      userId: req.user.id,
      action: "WALLET_DEPOSIT",
      entityType: "wallet",
      entityId: wallet.id,
      newValues: {
        amount: numericAmount,
        currency: wallet.currency,
        balance: updatedWallet.rows[0].balance,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    res.status(201).json({
      success: true,
      message: "Deposit successful",
      wallet: updatedWallet.rows[0],
      transaction: transaction.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Deposit error:", error);

    res.status(500).json({
      success: false,
      message: "Deposit failed",
    });
  } finally {
    client.release();
  }
};
const withdrawMoney = async (req, res) => {
  const client = await pool.connect();

  try {
    const { amount } = req.body;

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Withdrawal amount must be a positive number",
      });
    }

    await client.query("BEGIN");

    // Lock the wallet row
    const walletResult = await client.query(
      `SELECT id, balance, currency, status
       FROM wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [req.user.id]
    );

    if (walletResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Wallet not found",
      });
    }

    const wallet = walletResult.rows[0];

    // Check wallet status
    if (wallet.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Wallet is not active",
      });
    }

    // Check sufficient balance
    if (Number(wallet.balance) <  numericAmount) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // Generate transaction reference
    const reference = `WTH-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    // Update wallet balance
    const updatedWallet = await client.query(
      `UPDATE wallets
       SET balance = balance - $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, user_id, balance, currency, status, updated_at`,
      [numericAmount , wallet.id]
    );

    // Create transaction record
    const transaction = await client.query(
      `INSERT INTO transactions
       (wallet_id, type, amount, currency, status, reference)
       VALUES ($1, 'withdrawal', $2, $3, 'completed', $4)
       RETURNING id, wallet_id, type, amount, currency, status, reference, created_at`,
      [
        wallet.id,
        numericAmount,
        wallet.currency,
        reference,
      ]
    );
    await client.query(
        `INSERT INTO ledger_entries
        (transaction_id, wallet_id, entry_type, amount, currency, description)
        VALUES ($1, $2, 'debit', $3, $4, $5)`,
        [
            transaction.rows[0].id,
            wallet.id,
            numericAmount,
            wallet.currency,
            "Money withdrawn",
        ]
    );

    await client.query("COMMIT");
    await createAuditLog({
      userId: req.user.id,
      action: "WALLET_WITHDRAWAL",
      entityType: "wallet",
      entityId: wallet.id,
      newValues: {
        amount: numericAmount,
        currency: wallet.currency,
        balance: updatedWallet.rows[0].balance,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal successful",
      wallet: updatedWallet.rows[0],
      transaction: transaction.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Withdrawal error:", error);

    res.status(500).json({
      success: false,
      message: "Withdrawal failed",
    });
  } finally {
    client.release();
  }
};
const transferMoney = async (req, res) => {
  const client = await pool.connect();

  try {
    const { receiverUserId, amount } = req.body;

    const numericAmount = Number(amount);

    if (!receiverUserId) {
      return res.status(400).json({
        success: false,
        message: "Receiver user ID is required",
      });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Transfer amount must be a positive number",
      });
    }

    await client.query("BEGIN");

    // Get sender wallet
    const senderResult = await client.query(
      `SELECT id, user_id, balance, currency, status
       FROM wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [req.user.id]
    );

    if (senderResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Sender wallet not found",
      });
    }

    const senderWallet = senderResult.rows[0];

    // Prevent transferring to yourself
    if (senderWallet.user_id === receiverUserId) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "You cannot transfer money to yourself",
      });
    }

    // Check sender wallet
    if (senderWallet.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Sender wallet is not active",
      });
    }

    // Check sender balance
    if (Number(senderWallet.balance) <  numericAmount) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // Get and lock receiver wallet
    const receiverResult = await client.query(
      `SELECT id, user_id, balance, currency, status
       FROM wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [receiverUserId]
    );

    if (receiverResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Receiver wallet not found",
      });
    }

    const receiverWallet = receiverResult.rows[0];

    // Check receiver wallet
    if (receiverWallet.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Receiver wallet is not active",
      });
    }

    // Check currency
    if (senderWallet.currency !== receiverWallet.currency) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Wallet currencies do not match",
      });
    }

    const reference = `TRF-${Date.now()}-${Math.floor(
      Math.random() * 10000
    )}`;

    // Subtract money from sender
    const updatedSender = await client.query(
      `UPDATE wallets
       SET balance = balance - $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, user_id, balance, currency, status`,
      [numericAmount, senderWallet.id]
    );

    // Add money to receiver
    const updatedReceiver = await client.query(
      `UPDATE wallets
       SET balance = balance + $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, user_id, balance, currency, status`,
      [numericAmount, receiverWallet.id]
    );

    // Create sender transaction
    const senderTransaction = await client.query(
      `INSERT INTO transactions
       (wallet_id, type, amount, currency, status, reference)
       VALUES ($1, 'transfer', $2, $3, 'completed', $4)
       RETURNING id, wallet_id, type, amount, currency, status, reference, created_at`,
      [
        senderWallet.id,
        numericAmount,
        senderWallet.currency,
        reference,
      ]
    );

    // Create transfer record
    const transfer = await client.query(
      `INSERT INTO wallet_transfers
       (transaction_id, sender_wallet_id, receiver_wallet_id, amount, status, reference)
       VALUES ($1, $2, $3, $4, 'completed', $5)
       RETURNING id, transaction_id, sender_wallet_id, receiver_wallet_id,
                 amount, status, reference, created_at`,
      [
        senderTransaction.rows[0].id,
        senderWallet.id,
        receiverWallet.id,
        numericAmount,
        reference,
      ]
    );
    await createLedgerEntries(
        client,
        senderTransaction.rows[0].id,
        senderWallet.id,
        receiverWallet.id,
        numericAmount,
        senderWallet.currency
        );

    await client.query("COMMIT");
    await createAuditLog({
      userId: req.user.id,
      action: "WALLET_TRANSFER",
      entityType: "wallet_transfer",
      entityId: transfer.rows[0].id,
      newValues: {
        amount: numericAmount,
        currency: senderWallet.currency,
        sender_wallet_id: senderWallet.id,
        receiver_wallet_id: receiverWallet.id,
        reference: transfer.rows[0].reference,
        status: transfer.rows[0].status,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    res.status(201).json({
      success: true,
      message: "Transfer successful",
      transfer: transfer.rows[0],
      senderWallet: updatedSender.rows[0],
      receiverWallet: updatedReceiver.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Transfer error:", error);

    res.status(500).json({
      success: false,
      message: "Transfer failed",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getWallet,
  depositMoney,
  withdrawMoney,
  transferMoney,
};