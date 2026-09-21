const request = require("supertest");
const app = require("../app");

describe("Health API", () => {
  test("GET /health should return success", async () => {
    const response = await request(app)
      .get("/health");

    expect(response.statusCode).toBe(200);
    expect(response.text).toBe("Welcome to the PayFlow API");
  });
});