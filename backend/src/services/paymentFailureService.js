const recordPaymentFailure = async (
  client,
  payment,
  attemptNumber,
  errorCode,
  errorMessage
) => {
  const attemptResult = await client.query(
    `INSERT INTO payment_attempts
     (
       payment_id,
       provider,
       attempt_number,
       status,
       amount,
       currency,
       error_code,
       error_message
     )
     VALUES ($1, $2, $3, 'failed', $4, $5, $6, $7)
     RETURNING
       id,
       payment_id,
       provider,
       attempt_number,
       status,
       amount,
       currency,
       error_code,
       error_message,
       created_at`,
    [
      payment.id,
      "payflow_wallet",
      attemptNumber,
      payment.amount,
      payment.currency,
      errorCode,
      errorMessage,
    ]
  );

  await client.query(
    `UPDATE payments
     SET status = 'failed'
     WHERE id = $1`,
    [payment.id]
  );

  return attemptResult.rows[0];
};

module.exports = {
  recordPaymentFailure,
};