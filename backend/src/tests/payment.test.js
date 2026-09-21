const request = require("supertest");
const app = require("../app");

describe("Payment API", () => {
  let token;

  beforeAll(async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wallet@test.com",
        password: "Password123",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    token = response.body.token || response.body.session?.access_token;
  });

  test("POST /api/payments should reject an invalid amount", async () => {
    const response = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        merchantId: "baade89d-c542-4feb-91a0-16fbaf18e592",
        amount: -10,
        currency: "ETB",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("POST /api/payments should reject an unsupported currency", async () => {
    const response = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({
        merchantId: "baade89d-c542-4feb-91a0-16fbaf18e592",
        amount: 10,
        currency: "USD",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});