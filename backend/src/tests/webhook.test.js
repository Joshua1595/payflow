const request = require("supertest");
const crypto = require("crypto");
jest.setTimeout(20000);
const app = require("../app");
const pool = require("../config/db");

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const createSignature = (body) => {
  const rawBody = JSON.stringify(body);

  return crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
};

describe("Webhook Security", () => {
  test("rejects webhook with invalid signature", async () => {
    const webhook = {
      provider: "payflow_wallet",
      eventId: `evt-invalid-${Date.now()}`,
      eventType: "payment.status_changed",
      status: "successful",
      data: {},
    };

    const response = await request(app)
      .post("/api/webhooks")
      .set("x-webhook-signature", "invalid-signature")
      .send(webhook);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid webhook signature");
  });

  test("rejects webhook when signature is missing", async () => {
    const webhook = {
      provider: "payflow_wallet",
      eventId: `evt-missing-${Date.now()}`,
      eventType: "payment.status_changed",
      status: "successful",
      data: {},
    };

    const response = await request(app)
      .post("/api/webhooks")
      .send(webhook);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Invalid webhook signature");
  });

  test("rejects webhook when required fields are missing", async () => {
    const webhook = {
      provider: "payflow_wallet",
      eventId: `evt-fields-${Date.now()}`,
      status: "successful",
    };

    const signature = createSignature(webhook);

    const response = await request(app)
      .post("/api/webhooks")
      .set("x-webhook-signature", signature)
      .send(webhook);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
      "provider, eventId, eventType and status are required"
    );
  });

  test("processes a valid successful webhook", async () => {
    const paymentId = "ca24c44d-3170-4efe-83d8-ae2956c34956";

    const webhook = {
      provider: "payflow_wallet",
      eventId: `evt-success-${Date.now()}`,
      eventType: "payment.status_changed",
      paymentId,
      status: "successful",
      data: {
        source: "test",
      },
    };

    const signature = createSignature(webhook);

    const response = await request(app)
      .post("/api/webhooks")
      .set("x-webhook-signature", signature)
      .send(webhook);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Webhook processed successfully"
    );
    expect(response.body.webhook.status).toBe("processed");

    const paymentResult = await pool.query(
      `SELECT id, status
       FROM payments
       WHERE id = $1`,
      [paymentId]
    );

    expect(paymentResult.rows.length).toBe(1);
    expect(paymentResult.rows[0].status).toBe("completed");
  });
  test("does not process the same webhook event twice", async () => {
    const webhook = {
        provider: "payflow_wallet",
        eventId: `evt-duplicate-${Date.now()}`,
        eventType: "payment.status_changed",
        status: "successful",
        data: {
        source: "duplicate-test",
        },
    };

    const signature = createSignature(webhook);

    const firstResponse = await request(app)
        .post("/api/webhooks")
        .set("x-webhook-signature", signature)
        .send(webhook);

    expect(firstResponse.status).toBe(200);
    expect(firstResponse.body.message).toBe(
        "Webhook processed successfully"
    );

    const secondResponse = await request(app)
        .post("/api/webhooks")
        .set("x-webhook-signature", signature)
        .send(webhook);

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.success).toBe(true);
    expect(secondResponse.body.message).toBe(
        "Webhook already processed"
    );
 });
 test("marks webhook as failed when payment does not exist", async () => {
  const webhook = {
    provider: "payflow_wallet",
    eventId: `evt-unknown-payment-${Date.now()}`,
    eventType: "payment.status_changed",
    paymentId: "00000000-0000-0000-0000-000000000000",
    status: "successful",
    data: {
      source: "unknown-payment-test",
    },
  };

  const signature = createSignature(webhook);

  const response = await request(app)
    .post("/api/webhooks")
    .set("x-webhook-signature", signature)
    .send(webhook);

  expect(response.status).toBe(404);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toBe("Payment not found");

  const webhookResult = await pool.query(
    `SELECT provider, event_id, status, error_message
     FROM webhooks
     WHERE provider = $1
       AND event_id = $2`,
    [webhook.provider, webhook.eventId]
  );

  expect(webhookResult.rows.length).toBe(1);
  expect(webhookResult.rows[0].status).toBe("failed");
  expect(webhookResult.rows[0].error_message).toBe("Payment not found");
});
test("processes a failed payment webhook", async () => {
  const paymentId = "ca24c44d-3170-4efe-83d8-ae2956c34956";

  const webhook = {
    provider: "payflow_wallet",
    eventId: `evt-failed-${Date.now()}`,
    eventType: "payment.status_changed",
    paymentId,
    status: "failed",
    data: {
      source: "test-failed",
    },
  };

  const signature = createSignature(webhook);

  const response = await request(app)
    .post("/api/webhooks")
    .set("x-webhook-signature", signature)
    .send(webhook);

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.message).toBe(
    "Webhook processed successfully"
  );
  expect(response.body.webhook.status).toBe("processed");

  const paymentResult = await pool.query(
    `SELECT id, status
     FROM payments
     WHERE id = $1`,
    [paymentId]
  );

  expect(paymentResult.rows.length).toBe(1);
  expect(paymentResult.rows[0].status).toBe("failed");
});
test("processes a cancelled payment webhook", async () => {
  const paymentId = "ca24c44d-3170-4efe-83d8-ae2956c34956";

  const webhook = {
    provider: "payflow_wallet",
    eventId: `evt-cancelled-${Date.now()}`,
    eventType: "payment.status_changed",
    paymentId,
    status: "cancelled",
    data: {
      source: "test-cancelled",
    },
  };

  const signature = createSignature(webhook);

  const response = await request(app)
    .post("/api/webhooks")
    .set("x-webhook-signature", signature)
    .send(webhook);

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.message).toBe(
    "Webhook processed successfully"
  );
  expect(response.body.webhook.status).toBe("processed");

  const paymentResult = await pool.query(
    `SELECT id, status
     FROM payments
     WHERE id = $1`,
    [paymentId]
  );

  expect(paymentResult.rows.length).toBe(1);
  expect(paymentResult.rows[0].status).toBe("cancelled");
});
});