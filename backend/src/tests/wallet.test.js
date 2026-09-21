const request = require("supertest");
const app = require("../app");

describe("Wallet API", () => {
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

    token = response.body.token;
  });

  test("GET /api/wallet should return the customer's wallet", async () => {
    const response = await request(app)
      .get("/api/wallet")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.wallet).toBeDefined();
    expect(response.body.wallet.currency).toBe("ETB");
    expect(response.body.wallet.status).toBe("active");
  });
});