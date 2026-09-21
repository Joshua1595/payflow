const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");

// Set a longer timeout specifically for this setup block if the DB is slow
describe("Customer Payment Resource Authorization", () => {
  let customerAToken;
  let customerBToken;
  let paymentId;

  beforeAll(async () => {
    // 1. Login as Customer A
    const customerA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wallet@test.com",
        password: "Password123",
      });
    expect(customerA.statusCode).toBe(200);
    customerAToken = customerA.body.token;

    // 2. Login as Customer B
    const customerB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "receiver@test.com",
        password: "123456",
      });
    expect(customerB.statusCode).toBe(200);
    customerBToken = customerB.body.token;

    // 3. Find a payment belonging to Customer A
    const result = await pool.query(
      `
      SELECT id
      FROM payments
      WHERE customer_id = (
        SELECT id
        FROM users
        WHERE email = $1
      )
      LIMIT 1
      `,
      ["wallet@test.com"]
    );

    // If this fails, it means your test database has no data in it!
    expect(result.rows.length).toBeGreaterThan(0);
    paymentId = result.rows[0].id;
  }, 10000); // Give it 10 seconds to finish logins + database lookup

  test("Customer B should not access Customer A's payment", async () => {
    const response = await request(app)
      .get(`/api/customer/payments/${paymentId}`)
      .set("Authorization", `Bearer ${customerBToken}`);

    expect([404, 403]).toContain(response.statusCode);
    expect(response.body.success).toBe(false);
    expect([
      "Payment not found",
      "Not authorized",
      "Forbidden",
      "Access denied",
    ]).toContain(response.body.message);
  });

});