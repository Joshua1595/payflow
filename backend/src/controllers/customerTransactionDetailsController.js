const pool = require("../config/db");

const getCustomerTransactionDetails = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const result = await pool.query(
      `SELECT
          t.id,
          t.wallet_id,
          t.payment_id,
          t.type,
          t.amount,
          t.currency,
          t.status,
          t.reference,
          t.created_at
       FROM transactions t
       INNER JOIN wallets w
         ON w.id = t.wallet_id
       WHERE t.id = $1
         AND w.user_id = $2`,
      [transactionId, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    const transaction = result.rows[0];

    let payment = null;
    let transfer = null;

    if (transaction.payment_id) {
      const paymentResult = await pool.query(
        `SELECT
            p.id,
            p.merchant_id,
            p.amount,
            p.currency,
            p.status,
            p.reference,
            p.created_at,
            m.business_name
         FROM payments p
         INNER JOIN merchants m
           ON m.id = p.merchant_id
         WHERE p.id = $1`,
        [transaction.payment_id]
      );

      if (paymentResult.rows.length > 0) {
        payment = paymentResult.rows[0];
      }
    }

    if (transaction.type === "transfer") {
      const transferResult = await pool.query(
        `SELECT
            wt.id,
            wt.sender_wallet_id,
            wt.receiver_wallet_id,
            wt.amount,
            wt.status,
            wt.reference,
            wt.created_at
         FROM wallet_transfers wt
         WHERE wt.transaction_id = $1`,
        [transaction.id]
      );

      if (transferResult.rows.length > 0) {
        transfer = transferResult.rows[0];
      }
    }

    return res.status(200).json({
      success: true,
      transaction,
      payment,
      transfer,
    });
  } catch (error) {
    console.error(
      "Customer transaction details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transaction details",
    });
  }
};




module.exports = {
  getCustomerTransactionDetails, 
};