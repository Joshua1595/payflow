const request = require("supertest");
const app = require("../app");

describe("Authentication API", () => {
  test("POST /api/auth/login should reject invalid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "invalid-user@test.com",
        password: "wrong-password",
      });

    expect([400, 401]).toContain(response.statusCode);
    expect(response.body.success).toBe(false);
  });

  test("POST /api/auth/login should reject missing credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});