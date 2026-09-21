
const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");
jest.setTimeout(20000);
describe("Payment Idempotency API", () => {
  let token;
  let paymentId;

  beforeAll(async () => {
    // Login
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wallet@test.com",
        password: "Password123",
      });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.success).toBe(true);

    token =
      loginResponse.body.token ||
      loginResponse.body.accessToken ||
      loginResponse.body.data?.token ||
      loginResponse.body.data?.access_token ||
      loginResponse.body.data?.session?.access_token ||
      loginResponse.body.session?.access_token ||
      loginResponse.body.session?.token;

    expect(token).toBeTruthy();

    // Add enough funds for the test payment
    const depositResponse = await request(app)
      .post("/api/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 10,
        currency: "ETB",
      });

    expect(depositResponse.statusCode).toBe(201);
    expect(depositResponse.body.success).toBe(true);

    // Create a payment
    const paymentResponse = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        merchantId: "baade89d-c542-4feb-91a0-16fbaf18e592",
        amount: 1,
        currency: "ETB",
      });

    expect(paymentResponse.statusCode).toBe(201);
    expect(paymentResponse.body.success).toBe(true);

    paymentId = paymentResponse.body.payment.id;

    expect(paymentId).toBeTruthy();
  });

  test("same Idempotency-Key should not process the payment twice", async () => {
    const idempotencyKey = `jest-idempotency-${Date.now()}`;

    // First processing request
    const firstResponse = await request(app)
      .post(`/api/payments/${paymentId}/process`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotencyKey);

    expect(firstResponse.statusCode).toBe(200);
    expect(firstResponse.body.success).toBe(true);
    expect(firstResponse.body.payment.id).toBe(paymentId);

    // Count records after the first request
    const transactionBefore = await pool.query(
      `SELECT COUNT(*) AS count
       FROM transactions
       WHERE payment_id = $1`,
      [paymentId]
    );

    const attemptBefore = await pool.query(
      `SELECT COUNT(*) AS count
       FROM payment_attempts
       WHERE payment_id = $1`,
      [paymentId]
    );

    // Second request using the SAME idempotency key
    const secondResponse = await request(app)
      .post(`/api/payments/${paymentId}/process`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotencyKey);

    expect(secondResponse.statusCode).toBe(200);
    expect(secondResponse.body.success).toBe(true);
    expect(secondResponse.body.payment.id).toBe(paymentId);

    // Count records after the second request
    const transactionAfter = await pool.query(
      `SELECT COUNT(*) AS count
       FROM transactions
       WHERE payment_id = $1`,
      [paymentId]
    );

    const attemptAfter = await pool.query(
      `SELECT COUNT(*) AS count
       FROM payment_attempts
       WHERE payment_id = $1`,
      [paymentId]
    );

    // No duplicate transaction
    expect(Number(transactionAfter.rows[0].count)).toBe(
      Number(transactionBefore.rows[0].count)
    );

    // No duplicate payment attempt
    expect(Number(attemptAfter.rows[0].count)).toBe(
      Number(attemptBefore.rows[0].count)
    );
  }, 20000
);
});

