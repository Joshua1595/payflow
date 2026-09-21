const request = require("supertest");
const app = require("../app");

describe("Security and Authorization API", () => {
  let customerToken;

  beforeAll(async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wallet@test.com",
        password: "Password123",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    customerToken =
      response.body.token ||
      response.body.accessToken ||
      response.body.data?.token ||
      response.body.data?.access_token ||
      response.body.data?.session?.access_token ||
      response.body.session?.access_token ||
      response.body.session?.token;

    expect(customerToken).toBeTruthy();
  });

  test("customer should not access merchant dashboard", async () => {
    const response = await request(app)
      .get("/api/merchant-dashboard")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access denied");
  });

  test("customer should not access merchant payment history", async () => {
    const response = await request(app)
      .get("/api/merchant/payments")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access denied");
  });

  test("customer should not access merchant settlement history", async () => {
    const response = await request(app)
      .get("/api/merchant/settlements")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.statusCode).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Access denied");
  });

  test("customer should receive 404 for a nonexistent payment", async () => {
    const response = await request(app)
      .get(
        "/api/customer/payments/00000000-0000-0000-0000-000000000000"
      )
      .set("Authorization", `Bearer ${customerToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Payment not found");
  });
});