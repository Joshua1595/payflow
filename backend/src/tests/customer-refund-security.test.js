const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");

describe("Customer Refund Resource Authorization", () => {
  let customerAToken;
  let customerBToken;
  let refundId;

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

    // Find a refund belonging to Customer A
    const result = await pool.query(
      `
      SELECT r.id
      FROM refunds r
      INNER JOIN payments p
        ON p.id = r.payment_id
      WHERE p.customer_id = (
        SELECT id
        FROM users
        WHERE email = $1
      )
      LIMIT 1
      `,
      ["wallet@test.com"]
    );

    // Note: If this fails, it means your test database doesn't have an existing refund for this user yet.
    expect(result.rows.length).toBeGreaterThan(0);

    refundId = result.rows[0].id;
  }, 10000); 

  test("Customer B should not access Customer A's refund", async () => {
    const response = await request(app)
      .get(`/api/customer/refunds/${refundId}`)
      .set("Authorization", `Bearer ${customerBToken}`);

    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Refund not found");
  });

});