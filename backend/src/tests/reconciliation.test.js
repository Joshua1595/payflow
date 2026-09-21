
const request = require("supertest");
const app = require("../app");

jest.setTimeout(20000);

describe("Merchant Settlement Reconciliation API", () => {
  let token;

  beforeAll(async () => {
    const loginResponse = await request(app)
      .post("/api/auth/login")
      .send({
        email: "eyasu@test.com",
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
  });

  test(
    "GET /api/merchant/settlements/reconciliation should return a balanced result",
    async () => {
      const response = await request(app)
        .get("/api/merchant/settlements/reconciliation")
        .set("Authorization", `Bearer ${token}`);
      console.log(
        "RECONCILIATION RESPONSE:",
        JSON.stringify(response.body, null, 2)
      );
      expect(response.statusCode).toBeGreaterThanOrEqual(200);
      expect(response.statusCode).toBeLessThan(300);
      expect(response.body.success).toBe(true);

      expect(response.body.merchantId).toBeDefined();
      expect(response.body.merchantAccountId).toBeDefined();
      expect(response.body.currency).toBeDefined();

      expect(response.body.totalPayments).toBeGreaterThanOrEqual(0);
      expect(response.body.totalRefunds).toBeGreaterThanOrEqual(0);

      expect(response.body.completedSettlements)
        .toBeGreaterThanOrEqual(0);

      expect(response.body.pendingSettlements)
        .toBeGreaterThanOrEqual(0);

      expect(response.body.availableDifference)
        .toBeCloseTo(0, 2);

      expect(response.body.pendingDifference)
        .toBeCloseTo(0, 2);

      expect(response.body.balanced).toBe(true);
    },
    20000
  );
});

