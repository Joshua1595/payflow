
const request = require("supertest");
const app = require("../app");
jest.setTimeout(20000);
describe("Refund API", () => {
  let token;

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

    // Add test funds
    const depositResponse = await request(app)
      .post("/api/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 10,
        currency: "ETB",
      });

    expect(depositResponse.statusCode).toBe(201);
    expect(depositResponse.body.success).toBe(true);
  });

  test("POST /api/refunds/:paymentId should reject an invalid payment", async () => {
    const response = await request(app)
      .post("/api/refunds/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 1,
        reason: "Test refund",
      });

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("POST /api/refunds/:paymentId should create a refund for a completed payment", async () => {
    // Create payment
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

    const paymentId = paymentResponse.body.payment.id;

    // Process payment
    const idempotencyKey = `jest-refund-payment-${Date.now()}`;

    const processResponse = await request(app)
      .post(`/api/payments/${paymentId}/process`)
      .set("Authorization", `Bearer ${token}`)
      .set("Idempotency-Key", idempotencyKey);

    expect(processResponse.statusCode).toBe(200);
    expect(processResponse.body.success).toBe(true);

    // Create refund
    const refundResponse = await request(app)
      .post(`/api/refunds/${paymentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 1,
        reason: "Automated test refund",
    });

    expect(refundResponse.statusCode).toBe(201);
    expect(refundResponse.body.success).toBe(true);
    expect(refundResponse.body.refund).toBeDefined();
    expect(refundResponse.body.refund.payment_id).toBe(paymentId);
  },20000
);
});

