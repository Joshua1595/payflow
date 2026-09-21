const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");

describe("Customer Transaction Resource Authorization", () => {
  let customerAToken;
  let customerBToken;
  let transactionId;

  // Added a 10000ms (10 second) timeout to allow network and database operations to finish
  beforeAll(async () => {
    // Login as Customer A
    const customerA = await request(app)
      .post("/api/auth/login")
      .send({
        email: "wallet@test.com",
        password: "Password123",
      });

    expect(customerA.statusCode).toBe(200);
    customerAToken = customerA.body.token;

    // Login as Customer B
    const customerB = await request(app)
      .post("/api/auth/login")
      .send({
        email: "receiver@test.com",
        password: "123456",
      });

    expect(customerB.statusCode).toBe(200);
    customerBToken = customerB.body.token;

    // Find a transaction belonging to Customer A
    const result = await pool.query(
      `
      SELECT t.id
      FROM transactions t
      INNER JOIN wallets w
        ON w.id = t.wallet_id
      WHERE w.user_id = (
        SELECT id
        FROM users
        WHERE email = $1
      )
      LIMIT 1
      `,
      ["wallet@test.com"]
    );

    // Note: If this fails, make sure your test database seeding script runs before the test
    expect(result.rows.length).toBeGreaterThan(0);

    transactionId = result.rows[0].id;
  }, 10000); 

  test("Customer B should not access Customer A's transaction", async () => {
    const response = await request(app)
      .get(`/api/customer/transactions/${transactionId}`)
      .set("Authorization", `Bearer ${customerBToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Transaction not found");
  });

});
