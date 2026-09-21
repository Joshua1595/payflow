const pool = require("../config/db");

module.exports = async () => {
  await pool.end();
};