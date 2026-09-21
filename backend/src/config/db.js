
require("dotenv").config({ quiet: true });

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

  // Allow Jest/Node to exit when the pool has only idle connections.
  allowExitOnIdle: true,
});

module.exports = pool;

