const crypto = require("node:crypto");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "100kb" }));

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  const [salt, expectedHex] = String(storedValue || "").split(":");
  if (!salt || !expectedHex) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

function publicUser(row) {
  if (!row) return row;
  const { PasswordHash: _passwordHash, passwordhash: _passwordhash, ...safe } = row;
  return safe;
}

function validateCredentials(body) {
  const identifier = clean(body?.redId || body?.email || body?.username);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!identifier || password.length < 8) {
    return { error: "A user ID/email and a password of at least 8 characters are required." };
  }
  return { identifier, password };
}

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "signmeup-api" });
});

app.get("/health/database", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed", error);
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.get("/students", async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM er."Student" ORDER BY "StudentID"');
    res.json(result.rows);
  } catch (error) {
    console.error("Student query failed", error);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.post("/api/authorizedusers/create", async (req, res) => {
  const credentials = validateCredentials(req.body);
  if (credentials.error) return res.status(400).json({ error: credentials.error });
  const name = clean(req.body?.name) || credentials.identifier;
  const employeeNumber = Number(req.body?.employeeNumber);
  const jobTitle = clean(req.body?.jobTitle) || "Unknown";
  const accountType = clean(req.body?.accountType) || "student";
  if (!Number.isInteger(employeeNumber) || employeeNumber < 1) {
    return res.status(400).json({ error: "A positive employee number is required." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO signmeup."AuthorizedUser" ("EmployeeNumber", "UserName", "Email", "PasswordHash", "JobTitle", "AccountType")
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING "AccountNumber", "EmployeeNumber", "UserName", "Email", "JobTitle", "AccountType"`,
      [employeeNumber, name, credentials.identifier, hashPassword(credentials.password), jobTitle, accountType],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to create authorized user", error);
    res.status(409).json({ error: "Could not create authorized user. Check that the email and employee number are unique." });
  }
});

app.post("/api/authorizedusers/login", async (req, res) => {
  const credentials = validateCredentials(req.body);
  if (credentials.error) return res.status(400).json({ error: credentials.error });
  try {
    const result = await pool.query(
      `SELECT "AccountNumber", "EmployeeNumber", "UserName", "Email", "PasswordHash", "JobTitle", "AccountType"
       FROM signmeup."AuthorizedUser" WHERE lower("Email") = lower($1) OR lower("UserName") = lower($1) LIMIT 1`,
      [credentials.identifier],
    );
    const user = result.rows[0];
    if (!user || !verifyPassword(credentials.password, user.PasswordHash)) {
      return res.status(401).json({ error: "The user ID/email or password was not recognized." });
    }
    res.status(200).json(publicUser(user));
  } catch (error) {
    console.error("Failed to retrieve authorized user", error);
    res.status(500).json({ error: "Could not complete login." });
  }
});

app.get("/api/authorizedusers", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT "AccountNumber", "EmployeeNumber", "UserName", "Email", "JobTitle", "AccountType"
       FROM signmeup."AuthorizedUser" ORDER BY "AccountNumber"`,
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Failed to retrieve authorized users", error);
    res.status(500).json({ error: "Could not retrieve authorized users." });
  }
});

app.delete("/api/authorizedusers/:accountNumber", async (req, res) => {
  const accountNumber = Number(req.params.accountNumber);
  if (!Number.isInteger(accountNumber)) return res.status(400).json({ error: "A valid account number is required." });
  try {
    const result = await pool.query(
      'DELETE FROM signmeup."AuthorizedUser" WHERE "AccountNumber" = $1 RETURNING "AccountNumber", "EmployeeNumber", "UserName", "Email", "JobTitle", "AccountType"',
      [accountNumber],
    );
    if (!result.rowCount) return res.status(404).json({ error: "Authorized user not found." });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to delete authorized user", error);
    res.status(500).json({ error: "Could not delete authorized user." });
  }
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`SignMeUp API running on port ${PORT}`));
}

module.exports = app;
