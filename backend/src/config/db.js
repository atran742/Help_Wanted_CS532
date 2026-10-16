// database connection
const { Pool } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 2,
  idleTimeoutMillis: 5000,
  ssl: {
    rejectUnauthorized:false // required for serverless envs
  },
});

module.exports = pool;
