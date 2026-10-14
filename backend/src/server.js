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

/*
AUTHORIZED USER TABLE CRUD OPERATIONS
All of these queries will be directed to the signmeup.AuthorizedUser table for use on the login page and potentially to gather information about subsystem access in the future.
*/

//CREATE A NEW AUTHORIZED USER
//input: redId (varchar), password (varchar)
//output: new object with account number, email, and account type information
//TODO: encrypt password before input
app.post("/api/authorizedusers/create", async (req, res) => {
  const {redId, password} = req.body ?? {};
  if(
    false
    //TODO: add data cleaning/validation here?
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

//ATTEMPT TO MATCH LOGIN CREDENTIALS TO AN AUTHORIZED USER
//input: redId (varchar), password (varchar)
//output: details about the found object (or failure if none exists)
//TODO: encrypt password for search
app.post("/api/authorizedusers/login", async(req,res)=>{
  const {redId, password} = req.body ?? {};
  try{
    const result = await pool.query('SELECT * FROM signmeup."AuthorizedUser" WHERE "Email" = $1 AND "Password" = $2',[redId.trim(),password.trim()]);
    if(result.rowCount > 0){
      res.status(201).json(result.rows[0]);
    }
    else{
      res.status(500).json({error:"Failed to retrieve user for ID " + redId + "."});
    }
    
  }
  catch(err){
    console.error("Failed to retrieve user for ID " + redId);
    console.error(err);
  }
});

//GET ALL AUTHORIZED USERS
//input: none
//output: JSON array of rows (confirm?)
app.get("/api/authorizedusers", async(res)=>{
  try{
    const result = await pool.query('SELECT * FROM signmeup."AuthorizedUser"');
    if(result.rowCount > 0){
      res.status(201).json(result.rows[0]);
    }
    else{
      res.status(500).json({error:"No data found for the AuthorizedUser table."});
    }
    
  }
  catch(err){
    console.error("Failed to retrieve data for the AuthorizedUser table.");
    console.error(err);
  }
});

//DELETE A SPECIFIC AUTHORIZED USER
//input: redid (varchar), password (varchar)
//TODO: encrypt password for search
app.delete("/api/authorizedusers/login", async(req,res)=>{
  const {redId, password} = req.body ?? {};
  try{
    const result = await pool.query('DELETE FROM signmeup."AuthorizedUser" WHERE "Email" = $1 AND "Password" = $2',[redId.trim(),password.trim()]);
    if(result.rowCount > 0){
      res.status(201).json(result.rows[0]);
    }
    else{
      res.status(500).json({error:"Failed to delete user for ID " + redId + "."});
    }
    
  }
  catch(err){
    console.error("Failed to delete user for ID " + redId);
    console.error(err);
  }
});



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
