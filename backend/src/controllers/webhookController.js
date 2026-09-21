const crypto = require("crypto");
const pool = require("../config/db");
const { createAuditLog } = require("../services/auditService");
const verifyWebhookSignature = (req) => {
  const signature = req.headers["x-webhook-signature"];
  const secret = process.env.WEBHOOK_SECRET;

  console.log("----- WEBHOOK SIGNATURE DEBUG -----");
  console.log("Secret loaded:", !!secret);
  console.log("Raw body exists:", !!req.rawBody);
  console.log("Raw body length:", req.rawBody ? req.rawBody.length : 0);
  console.log("Received signature:", signature);

  if (!signature || !secret || !req.rawBody) {
    console.log("Missing signature, secret, or raw body");
    console.log("----------------------------------");
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(req.rawBody)
    .digest("hex");

  console.log("Expected signature:", expectedSignature);
  console.log(
    "Signature matches:",
    signature === expectedSignature
  );
  console.log("----------------------------------");

  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (receivedBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    receivedBuffer,
    expectedBuffer
  );
};

const receiveWebhook = async (req, res) => {
  const client = await pool.connect();

  try {
    // 1. Verify signature first
    const signatureValid = verifyWebhookSignature(req);

    if (!signatureValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const {
      provider,
      eventId,
      eventType,
      paymentId,
      status,
      data,
    } = req.body;

    if (!provider || !eventId || !eventType || !status) {
      return res.status(400).json({
        success: false,
        message:
          "provider, eventId, eventType and status are required",
      });
    }

    await client.query("BEGIN");
    // 2. Check duplicate event
    const existingWebhook = await client.query(
      `SELECT id,status,event_type,payment_id
       FROM webhooks
       WHERE provider = $1
         AND event_id = $2
       FOR UPDATE`,
      [provider, eventId]
    );

    if (existingWebhook.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(200).json({
        success: true,
        message: "Webhook already processed",
        webhook: existingWebhook.rows[0],
      });
    }

    // 3. Store webhook
    let validPaymentId = paymentId || null;

    if (paymentId) {
      const paymentCheck = await client.query(
        `SELECT id
        FROM payments
        WHERE id = $1`,
        [paymentId]
      );

      if (paymentCheck.rows.length === 0) {
        validPaymentId = null;
      }
    }

    const webhookResult = await client.query(
      `INSERT INTO webhooks
      (provider,event_id,event_type,payment_id,status,payload)
      VALUES ($1,$2,$3,$4,'received',$5)
      RETURNING id,provider,event_id,event_type,payment_id,status,received_at`,
      [
        provider,
        eventId,
        eventType,
        validPaymentId,
        JSON.stringify(data || {}),
      ]
    );

    const webhook = webhookResult.rows[0];
    if (paymentId && !validPaymentId) {
      await client.query(
        `UPDATE webhooks
        SET status='failed',
            error_message='Payment not found'
        WHERE id=$1`,
        [webhook.id]
      );

      await client.query("COMMIT");

      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }
    // 4. Process payment status
    if (validPaymentId) {
      const paymentResult = await client.query(
        `SELECT id,status
         FROM payments
         WHERE id=$1
         FOR UPDATE`,
        [validPaymentId]
      );

      if (paymentResult.rows.length === 0) {
        await client.query(
          `UPDATE webhooks
           SET status='failed',
               error_message='Payment not found'
           WHERE id=$1`,
          [webhook.id]
        );

        await client.query("COMMIT");

        return res.status(404).json({
          success: false,
          message: "Payment not found",
        });
      }

      let newPaymentStatus = null;

      if (status === "successful") {
        newPaymentStatus = "completed";
      } else if (status === "failed") {
        newPaymentStatus = "failed";
      } else if (status === "cancelled") {
        newPaymentStatus = "cancelled";
      }

      if (newPaymentStatus) {
        await client.query(
          `UPDATE payments
           SET status=$1
           WHERE id=$2`,
          [newPaymentStatus, validPaymentId]
        );
      }

      await client.query(
        `UPDATE webhooks
         SET status='processed',
             processed_at=NOW()
         WHERE id=$1`,
        [webhook.id]
      );
    } else {
      await client.query(
        `UPDATE webhooks
         SET status='processed',
             processed_at=NOW()
         WHERE id=$1`,
        [webhook.id]
      );
    }
    await client.query("COMMIT");
    await createAuditLog({
      userId: null,
      action: "WEBHOOK_PROCESSED",
      entityType: "webhook",
      entityId: webhook.id,
      newValues: {
        provider: webhook.provider,
        event_id: webhook.event_id,
        event_type: webhook.event_type,
        payment_id: webhook.payment_id,
        status: webhook.status,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      webhook: {
        ...webhook,
        status: "processed",
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  } finally {
    client.release();
  }
};

module.exports = {
  receiveWebhook,
};