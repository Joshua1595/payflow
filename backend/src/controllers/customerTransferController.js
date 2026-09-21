
const pool = require("../config/db");
const {
  createLedgerEntries,
} = require("../services/ledgerService");
const { createAuditLog } = require("../services/auditService");

const getCustomerTransfers = async (req, res) => {
  try {
    const customerId = req.user.id;

    const page = Math.max(Number(req.query.page) || 1, 1);

    const limit = Math.min(
      Math.max(Number(req.query.limit) || 20, 1),
      100
    );

    const offset = (page - 1) * limit;

    const { direction } = req.query;

    const walletResult = await pool.query(
      `SELECT id
       FROM wallets
       WHERE user_id = $1`,
      [customerId]
    );

    if (walletResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer wallet not found",
      });
    }

    const walletId = walletResult.rows[0].id;

    const params = [walletId];

    let whereClause = `
      WHERE (
        wt.sender_wallet_id = $1
        OR wt.receiver_wallet_id = $1
      )
    `;

    if (direction === "sent") {
      whereClause = `WHERE wt.sender_wallet_id = $1`;
    }

    if (direction === "received") {
      whereClause = `WHERE wt.receiver_wallet_id = $1`;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) AS total
       FROM wallet_transfers wt
       ${whereClause}`,
      params
    );

    params.push(limit);
    params.push(offset);

    const result = await pool.query(
      `SELECT
          wt.id,
          wt.transaction_id,
          wt.sender_wallet_id,
          wt.receiver_wallet_id,
          wt.amount,
          wt.status,
          wt.reference,
          wt.created_at,
          CASE
            WHEN wt.sender_wallet_id = $1
              THEN 'sent'
            ELSE 'received'
          END AS direction
       FROM wallet_transfers wt
       ${whereClause}
       ORDER BY wt.created_at DESC
       LIMIT $${params.length - 1}
       OFFSET $${params.length}`,
      params
    );

    const total = Number(countResult.rows[0].total);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      transfers: result.rows,
    });
  } catch (error) {
    console.error("Customer transfer history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve customer transfers",
    });
  }
};

const sendMoney = async (req, res) => {
  const client = await pool.connect();

  try {
    const { receiverEmail, amount } = req.body;

    const numericAmount = Number(amount);

    if (!receiverEmail) {
      return res.status(400).json({
        success: false,
        message: "Receiver email is required",
      });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Transfer amount must be a positive number",
      });
    }

    await client.query("BEGIN");

    // Find receiver by email
    const receiverResult = await client.query(
      `SELECT id, name, email, role, is_active
       FROM users
       WHERE LOWER(email) = LOWER($1)`,
      [receiverEmail.trim()]
    );

    if (receiverResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    const receiver = receiverResult.rows[0];

    // Prevent transfer to yourself
    if (receiver.id === req.user.id) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "You cannot transfer money to yourself",
      });
    }

    // Check receiver account
    if (!receiver.is_active) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Receiver account is not active",
      });
    }

    // Get and lock sender wallet
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

    if (senderWallet.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Sender wallet is not active",
      });
    }

    if (Number(senderWallet.balance) < numericAmount) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    // Get and lock receiver wallet
    const receiverWalletResult = await client.query(
      `SELECT id, user_id, balance, currency, status
       FROM wallets
       WHERE user_id = $1
       FOR UPDATE`,
      [receiver.id]
    );

    if (receiverWalletResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Receiver wallet not found",
      });
    }

    const receiverWallet = receiverWalletResult.rows[0];

    if (receiverWallet.status !== "active") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        success: false,
        message: "Receiver wallet is not active",
      });
    }

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

    // Deduct sender wallet
    const updatedSender = await client.query(
      `UPDATE wallets
       SET balance = balance - $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, user_id, balance, currency, status`,
      [numericAmount, senderWallet.id]
    );

    // Credit receiver wallet
    const updatedReceiver = await client.query(
      `UPDATE wallets
       SET balance = balance + $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id, user_id, balance, currency, status`,
      [numericAmount, receiverWallet.id]
    );

    // Create transaction
    const transactionResult = await client.query(
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

    const transaction = transactionResult.rows[0];

    // Create transfer record
    const transferResult = await client.query(
      `INSERT INTO wallet_transfers
       (transaction_id, sender_wallet_id, receiver_wallet_id, amount, status, reference)
       VALUES ($1, $2, $3, $4, 'completed', $5)
       RETURNING id, transaction_id, sender_wallet_id,
                 receiver_wallet_id, amount, status,
                 reference, created_at`,
      [
        transaction.id,
        senderWallet.id,
        receiverWallet.id,
        numericAmount,
        reference,
      ]
    );

    const transfer = transferResult.rows[0];

    // Create ledger entries
    await createLedgerEntries(
      client,
      transaction.id,
      senderWallet.id,
      receiverWallet.id,
      numericAmount,
      senderWallet.currency
    );

    await client.query("COMMIT");

    // Audit log after successful transaction
    await createAuditLog({
      userId: req.user.id,
      action: "WALLET_TRANSFER",
      entityType: "wallet_transfer",
      entityId: transfer.id,
      newValues: {
        amount: numericAmount,
        currency: senderWallet.currency,
        sender_wallet_id: senderWallet.id,
        receiver_wallet_id: receiverWallet.id,
        reference: transfer.reference,
        status: transfer.status,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(201).json({
      success: true,
      message: "Transfer successful",
      transfer,
      senderWallet: updatedSender.rows[0],
      receiverWallet: updatedReceiver.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Customer send money error:", error);

    return res.status(500).json({
      success: false,
      message: "Transfer failed",
    });
  } finally {
    client.release();
  }
};

const getCustomerTransferDetails = async (req, res) => {
  try {
    const { transferId } = req.params;

    const result = await pool.query(
      `SELECT
          wt.id,
          wt.transaction_id,
          wt.sender_wallet_id,
          wt.receiver_wallet_id,
          wt.amount,
          wt.status,
          wt.reference,
          wt.created_at,

          sender_user.id AS sender_user_id,
          sender_user.name AS sender_name,
          sender_user.email AS sender_email,

          receiver_user.id AS receiver_user_id,
          receiver_user.name AS receiver_name,
          receiver_user.email AS receiver_email

       FROM wallet_transfers wt

       INNER JOIN wallets sender_wallet
         ON sender_wallet.id = wt.sender_wallet_id

       INNER JOIN users sender_user
         ON sender_user.id = sender_wallet.user_id

       INNER JOIN wallets receiver_wallet
         ON receiver_wallet.id = wt.receiver_wallet_id

       INNER JOIN users receiver_user
         ON receiver_user.id = receiver_wallet.user_id

       WHERE wt.id = $1
         AND (
           sender_wallet.user_id = $2
           OR receiver_wallet.user_id = $2
         )`,
      [transferId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transfer not found",
      });
    }

    const transfer = result.rows[0];

    const direction =
      transfer.sender_user_id === req.user.id
        ? "sent"
        : "received";

    return res.status(200).json({
      success: true,
      transfer: {
        id: transfer.id,
        transaction_id: transfer.transaction_id,
        sender_wallet_id: transfer.sender_wallet_id,
        receiver_wallet_id: transfer.receiver_wallet_id,
        amount: transfer.amount,
        status: transfer.status,
        reference: transfer.reference,
        created_at: transfer.created_at,
        direction,

        sender: {
          id: transfer.sender_user_id,
          name: transfer.sender_name,
          email: transfer.sender_email,
        },

        receiver: {
          id: transfer.receiver_user_id,
          name: transfer.receiver_name,
          email: transfer.receiver_email,
        },
      },
    });
  } catch (error) {
    console.error(
      "Customer transfer details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transfer details",
    });
  }
};

const findReceiver = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Receiver email is required",
      });
    }

    const result = await pool.query(
      `SELECT
          id,
          name,
          email,
          is_active
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    const receiver = result.rows[0];

    if (!receiver.is_active) {
      return res.status(400).json({
        success: false,
        message: "Receiver account is not active",
      });
    }

    if (receiver.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot transfer money to yourself",
      });
    }

    return res.status(200).json({
      success: true,
      receiver: {
        id: receiver.id,
        name: receiver.name,
        email: receiver.email,
      },
    });
  } catch (error) {
    console.error("Find receiver error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to find receiver",
    });
  }
};



module.exports = {
  getCustomerTransfers,
  sendMoney,
  getCustomerTransferDetails ,
  findReceiver ,
};

