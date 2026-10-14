const express = require("express");
const cors = require("cors");
require("dotenv").config();
const pool = require("./config/db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/students", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM er."Student"');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database query failed" });
  }
});

app.post("/authorizedusers/post", async (req, res) => {
  const {redId, password} = req.body ?? {};
  if(
    false
    //todo: add data cleaning/validation here
  ){
    return res.status(400).json({error: "Username/Password are invalid/missing."});
  }
    try{
      const result = await pool.query('INSERT INTO signmeup."AuthorizedUser" ("Email", "Password", "AccountType") VALUES ($1, $2, $3) RETURNING "AccountNumber","Email","AccountType"',[redId.trim(),password.trim(),"Unknown"]);
      res.status(201).json(result.rows[0]);
  }
  catch(err){
    console.error("Failed to add user.");
    console.error(err);
    res.status(500).json({ error: "Could not create authorized user."});
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
