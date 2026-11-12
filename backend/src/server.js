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
  const identifier = clean(body?.redId || body?.email);
  const password = typeof body?.password === "string" ? body.password : "";
  if (!identifier || password.length < 8) {
    return { error: "A user ID/email and a password of at least 8 characters are required." };
  }
  return { identifier, password };
}

function registerGetEndpoint(path, query, resource) {
  app.get(path, async (_req, res) => {
    try {
      const result = await pool.query(query);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error(`Failed to retrieve ${resource}`, error);
      res.status(500).json({ error: `Could not retrieve ${resource}.` });
    }
  });
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

const getEndpoints = [
  [
    "/api/students",
    'SELECT * FROM er."Student" ORDER BY "StudentID"',
    "students",
  ],
  ["/students", 'SELECT * FROM er."Student" ORDER BY "StudentID"', "students"],
  [
    "/api/student-notes",
    'SELECT * FROM er."StudentNote" ORDER BY "StudentID", "CreateDate"',
    "student notes",
  ],
  [
    "/api/transcripts",
    'SELECT * FROM er."Transcript" ORDER BY "StudentID", "TranscriptID"',
    "transcripts",
  ],
  [
    "/api/transfer-courses",
    'SELECT * FROM er."TransferCourse" ORDER BY "StudentID", "TransferCourseID"',
    "transfer courses",
  ],
  [
    "/api/departments",
    'SELECT * FROM reg."Department" ORDER BY "DepartmentCode"',
    "departments",
  ],
  ["/api/courses", 'SELECT * FROM reg."Course" ORDER BY "CourseID"', "courses"],
  [
    "/api/prerequisites",
    'SELECT * FROM reg."Prerequisite" ORDER BY "CourseID", "PrereqID"',
    "course prerequisites",
  ],
  ["/api/classes", 'SELECT * FROM reg."Class" ORDER BY "ClassID"', "classes"],
  [
    "/api/enrollments",
    'SELECT * FROM reg."Enrollment" ORDER BY "StudentID", "ClassID"',
    "enrollments",
  ],
  ["/api/majors", 'SELECT * FROM major."Major" ORDER BY "MajorID"', "majors"],
  [
    "/api/major-courses",
    'SELECT * FROM major."MajorCourse" ORDER BY "MajorID", "CourseID"',
    "major courses",
  ],
  [
    "/api/major-advisors",
    'SELECT * FROM major."MajorAdvisor" ORDER BY "MajorID", "EmployeeNumber"',
    "major advisors",
  ],
  [
    "/api/approved-outlines",
    'SELECT * FROM major."ApprovedOutline" ORDER BY "StudentID", "OutlineID"',
    "approved outlines",
  ],
  [
    "/api/outline-entries",
    'SELECT * FROM major."OutlineEntry" ORDER BY "OutlineID", "CourseID"',
    "outline entries",
  ],
  [
    "/api/outline-history",
    'SELECT * FROM major."OutlineHistory" ORDER BY "OutlineID", "ChangedAt"',
    "outline history",
  ],
  ["/api/faculty", 'SELECT * FROM fci."Faculty" ORDER BY "FacultyID"', "faculty"],
  [
    "/api/faculty-teaching-departments",
    'SELECT * FROM fci."FacultyTeachingDepartment" ORDER BY "FacultyID", "DepartmentCode"',
    "faculty teaching departments",
  ],
  [
    "/api/qualified-faculty",
    'SELECT * FROM fci."QualifiedFaculty" ORDER BY "FacultyID", "CourseID"',
    "faculty qualifications",
  ],
  [
    "/api/grades",
    'SELECT * FROM grade."CourseGrade" ORDER BY "ClassID", "StudentID"',
    "grades",
  ],
  [
    "/api/course-comments",
    'SELECT * FROM grade."CourseComment" ORDER BY "ClassID"',
    "course comments",
  ],
  [
    "/api/audit",
    'SELECT * FROM signmeup."TransactionAudit" ORDER BY "CreatedAt" DESC, "AuditID" DESC',
    "audit events",
  ],
  [
    "/api/subsystems",
    'SELECT * FROM signmeup."Subsystem" ORDER BY "SubsystemID"',
    "subsystems",
  ],
  [
    "/api/subsystem-access",
    'SELECT * FROM signmeup."SubsystemAccess" ORDER BY "EmployeeNumber", "SubsystemID"',
    "subsystem access",
  ],
];

for (const [path, query, resource] of getEndpoints) {
  registerGetEndpoint(path, query, resource);
}

app.post("/api/authorizedusers/create", async (req, res) => {
  const credentials = validateCredentials(req.body);
  if (credentials.error) return res.status(400).json({ error: credentials.error });
  const accountType = clean(req.body?.accountType) || "student";
  if (!["student", "faculty", "advisor", "admin"].includes(accountType)) {
    return res.status(400).json({ error: "A valid account type is required." });
  }
  try {
    const result = await pool.query(
      `INSERT INTO signmeup."AuthorizedUser" ("Email", "PasswordHash", "AccountType")
       VALUES ($1, $2, $3)
       RETURNING "AccountNumber", "Email", "AccountType"`,
      [credentials.identifier, hashPassword(credentials.password), accountType],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Failed to create authorized user", error);
    res.status(409).json({ error: "Could not create authorized user. Check that the email is unique." });
  }
});

app.post("/api/authorizedusers/login", async (req, res) => {
  const credentials = validateCredentials(req.body);
  if (credentials.error) return res.status(400).json({ error: credentials.error });
  try {
    const result = await pool.query(
      `SELECT "AccountNumber", "Email", "PasswordHash", "AccountType"
       FROM signmeup."AuthorizedUser" WHERE lower("Email") = lower($1) LIMIT 1`,
      [credentials.identifier],
    );
    const user = result.rows[0];
    if (!user) {
      console.warn("Login rejected: no authorized-user account matched.");
      return res.status(401).json({ error: "The user ID/email or password was not recognized." });
    }
    if (!verifyPassword(credentials.password, user.PasswordHash)) {
      console.warn("Login rejected: password did not match the stored hash.");
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
      `SELECT "AccountNumber", "Email", "AccountType"
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
      'DELETE FROM signmeup."AuthorizedUser" WHERE "AccountNumber" = $1 RETURNING "AccountNumber", "Email", "AccountType"',
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
