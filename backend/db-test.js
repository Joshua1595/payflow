
require("dotenv").config();

const pool = require("./src/config/db");

async function test() {
  try {
    console.time("query");

    const result = await pool.query(
      "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1",
      ["invalid-user@test.com"]
    );

    console.timeEnd("query");

    console.log("ROWS:", result.rows.length);
    console.log(result.rows);
  } catch (error) {
    console.error("DB ERROR:", error);
  } finally {
    await pool.end();
  }
}

test();

