import express  from "express";
import cors from "cors"
import mysql from "mysql2";
import "dotenv/config";
import bcrypt, { compare } from "bcrypt"
import  jwt  from "jsonwebtoken";
import crypto from "crypto"
import rateLimit from "express-rate-limit";
const app = express();
app.use(express.json());
app.set("trust proxy", 1);
app.use(cors({ origin: [process.env.FRONTEND_URL, "http://localhost:3000"] }));
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  dateStrings: true,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  connectionLimit: 5,
});
db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err.message);
    return;
  }
  console.log("Connected to MySQL");
});

const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      Message: "NO TOKEN AVAILABLE TO PROCEED",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const verify = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verify.id;

    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message);

    return res.status(401).json({
      Message: err.message,
    });
  }
};

app.get("/", (req, res) => {
    res.send("App is running!")
});

import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});
app.use(["/login", "/signup", "/demo"], authLimiter);
app.post("/demo", async (req, res) => {
  try {
    const username = "guest_" + crypto.randomBytes(4).toString("hex");
    const hash = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);

    db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hash], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Could not start the demo" });
      }
      const userId = result.insertId;
      const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
      const samples = [
        ["Northwind Labs", "Frontend Developer", "Remote", "React, Next.js, Tailwind", 150000, 2, "Interview", daysAgo(2)],
        ["Fieldnote", "React Developer Intern", "Karachi", "React, CSS", null, 0, "Applied", daysAgo(3)],
        ["Brightloop", "Full-Stack Engineer", "Lahore", "Node, Express, MySQL", 220000, 3, "Assessment", daysAgo(5)],
        ["Kiln & Co", "Junior Web Developer", "Remote", "HTML, CSS, JavaScript", 90000, 1, "Saved", daysAgo(6)],
        ["Harbor Systems", "Backend Intern", "Islamabad", "Node, SQL", null, 0, "Rejected", daysAgo(9)],
        ["Pinecrest", "Frontend Intern", "Remote", "React, Tailwind", null, 0, "Offer", daysAgo(12)],
      ].map((row) => [...row, userId]);

      db.query(
        "INSERT INTO jobs (company, role, location, skills, salary, experience, status, date_applied, user_id) VALUES ?",
        [samples],
        (err2) => {
          if (err2) {
            console.log(err2);
            return res.status(500).json({ message: "Could not start the demo" });
          }
          const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "2h" });
          res.json({ token, username: "Guest" });
        }
      );
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get("/jobs", checkAuth, (req, res) => {
  db.query(
    "SELECT id, company, role, location, skills, salary, experience, status, date_applied AS dateApplied FROM jobs WHERE user_id = ?",
    [req.userId],
    (err, results) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal error from database" });
      }

      if(results){
        res.status(200).json(results)
      }
    }
  );
});
 const validStatuses = ["Applied", "Interview", "Offer", "Rejected", "Accepted", "Waitlisted"];

 
app.get("/jobs/stats", checkAuth, (req, res) => {
  db.query(
    "SELECT status, count(*) AS total FROM jobs WHERE user_id = ? GROUP BY status",
    [req.userId],
    (err, results) => {
      if(err){
        return res.status(500).json({message:"Internal error from database"})
      }
      res.status(200).json(results)
    }
  )
})

app.get("/jobs/:id", checkAuth, (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)){
    return res.status(400).json({message:"Invalid request"})
  }

  db.query(
    "SELECT id, company, role, location, skills, salary, experience, status, date_applied AS dateApplied FROM jobs WHERE id = ? AND user_id = ?",
    [id, req.userId],
    (err, results) => {
      if (err){
        return res.status(500).json({message:"Internal error from database"})
      }
      else if (results.length === 0){
        return res.status(404).json({message:"Fill in the ID"})
      }
      else{
        res.json(results[0])
      }
    }
  )
})

app.post("/jobs", checkAuth, (req, res) => {
  const { company, role, salary, location, experience, skills } = req.body;
  const userId = req.userId;

  if (company === undefined || role === undefined || location === undefined || experience === undefined || skills === undefined) {
    return res.status(400).json({ message: "Fill required fields" });
  }

  if (company.length > 100 || role.length > 100 || location.length > 100 || skills.length > 255) {
    return res.status(400).json({ message: "Exceeded the limit" });
  }

  db.query(
    "INSERT INTO jobs (user_id, company, role, location, skills, salary, experience) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [userId, company, role, location, skills, salary ?? null, experience],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal error from database" });
      }
      res.status(201).json({ id: result.insertId, company, role, location, skills, salary: salary ?? null, experience });
    }
  );
});

app.delete("/jobs/:id", checkAuth, (req,res)=>{
  const id = parseInt(req.params.id);

  if (isNaN(id)){
    return res.status(400).json({message:"Bad request"})
  }

  db.query(
    "DELETE FROM jobs WHERE id = ? AND user_id = ?",
    [id, req.userId],
    (err,results)=>{
      if(err){
        console.log(err);
        return res.status(500).json({message:"Internal server error"})
      }

      if (results.affectedRows === 0){
        return res.status(404).json({message:"Id not found"})
      }
      else{
        res.status(200).json({message:"Job deleted"})
      }
    }
  )
})

app.put("/jobs/:id", checkAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { company, role, salary, location, experience, skills, status } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  if (status !== undefined && !validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
 
  const fields = [];
  const values = [];
  if (company !== undefined) { fields.push("company = ?"); values.push(company); }
  if (role !== undefined)  {fields.push("role = ?"); values.push(role)}
 if (salary !== undefined)  {fields.push("salary = ?"); values.push(salary)}
  if (location !== undefined)  {fields.push("location = ?"); values.push(location)}
   if (experience !== undefined)  {fields.push("experience = ?"); values.push(experience)}
    if (skills !== undefined)  {fields.push("skills = ?"); values.push(skills)}
    if (status !== undefined) { fields.push("status = ?"); values.push(status); }
  if (fields.length === 0) {
    return res.status(400).json({ message: "Nothing to update" });
  }

  values.push(id,req.userId);
    if (company !== undefined && (typeof company !== "string" || company.trim() === "" || company.length > 100)) {
    return res.status(400).json({ message: "Company must be 1 to 100 characters" });
  }

  if (role !== undefined && (typeof role !== "string" || role.trim() === "" || role.length > 100)) {
    return res.status(400).json({ message: "Role must be 1 to 100 characters" });
  }

  if (location !== undefined && (typeof location !== "string" || location.trim() === "" || location.length > 100)) {
    return res.status(400).json({ message: "Location must be 1 to 100 characters" });
  }

  if (skills !== undefined && (typeof skills !== "string" || skills.length > 255)) {
    return res.status(400).json({ message: "Skills must be 255 characters or fewer" });
  }

  if (salary !== undefined && salary !== null && (typeof salary !== "number" || salary < 0)) {
    return res.status(400).json({ message: "Salary must be a positive number" });
  }

  if (experience !== undefined && (typeof experience !== "number" || experience < 0)) {
    return res.status(400).json({ message: "Experience must be a positive number" });
  }

  db.query("UPDATE jobs SET " + fields.join(", ") + " WHERE id = ? AND user_id = ?", values, (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json({ message: "Internal error from database" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ message: "Job updated" });
  });
});

        //  SIGN UP PAGE
  app.post("/signup", async (req,res)=>{
    const {username,password} = req.body

    if (!username || !password || username.length===0 || password.length===0){
    return  res.status(400).json({message:"Fill in the missing requirements"})
    }
  if (typeof username !== "string" || username.length > 26) {
  return res.status(400).json({ message: "Username must be text of 50 characters or fewer" });
}
    if(typeof password !== "string" || password.length>72 || password.length<8){
   return res.status(400).json({message:"Your password has exceeded the limit or is to short"})
    }
    try{
      const hashedpassword = await bcrypt.hash(password,10)
    db.query("INSERT INTO users (username,password) VALUES (?,?)",[username,hashedpassword],(err,results)=>{
      if(err){
      if (err.code === "ER_DUP_ENTRY"){
    return  res.status(409).json({message:"Username is already taken"})
      }
         console.log(err);
  return res.status(500).json({ message: "Internal error from database" }); 
    }
     return res.status(201).json({id:results.insertId,username})  
    })}
    catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
  })
          //  LOGIN
  app.post("/login", (req,res)=>{
     const {username,password} = req.body
     if(!username || !password || typeof username !== "string" || typeof password !== "string"){
   return   res.status(400).json({message:"Fill in the missing fields or put it in "})
     }
     db.query("SELECT id,username,password FROM users WHERE username = ?",[username], async (err,results)=>{
      console.log(err);
        if (err){
      return res.status(500).json({message:"Internal error from database"})
        }
       if (results.length ===0){
     return   res.status(401).json({message:"Invalid Username or Password"})
       }
       try{
         const match = await bcrypt.compare(password,results[0].password)
         if(!match){
     return   res.status(401).json({message:"Incorrect username or Password"})
         }
       const token = jwt.sign({id:results[0].id},process.env.JWT_SECRET,{expiresIn: "1h"})
   res.json({ token, username: results[0].username });
       }
       catch (error){
        console.log(error);
        res.status(500).json({message:"Something went Wrong"})
       }
     })
  })