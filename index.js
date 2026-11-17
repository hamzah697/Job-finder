import express  from "express";
import cors from "cors"
import mysql from "mysql2";
import "dotenv/config";
const app = express();
app.use(express.json());
app.use(cors())
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.log("Database connection failed:", err.message);
    return;
  }
  console.log("Connected to MySQL");
});



app.get("/", (req, res) => {
    res.send("App is running!")
});

app.listen(5000, () => {
    console.log("Server is running on port 5000");
})

 app.get("/jobs", (req, res) => {
  db.query(
    "SELECT id, company, role, location, skills, salary, experience, status, date_applied AS dateApplied FROM jobs",
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

 
app.get("/jobs/stats",(req,res)=>{
     db.query("SELECT status,count(*) AS total from jobs group by status;",(err,results)=>{
      if(err){
        return res.status(500).json({message:"Internal error from database"})
      }    
  res.status(200).json(results)
      
     })
})

app.get("/jobs/:id", (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)){
    return res.status(400).json({message:"Invalid request"})
  }
  db.query("SELECT id, company, role, location, skills, salary, experience, status,date_applied AS dateApplied from jobs WHERE ID = ?",[id],(err,results)=>{
   if (err){
   return res.status(500).json({message:"Internal error from database"})
   }
   else if (results.length === 0){
   res.status(404).json({message:"Fill in the ID"})
   }
   else{
    res.json(results[0])
   }
  })  
})

app.post("/jobs", (req, res) => {
  const { company, role, salary, location, experience, skills } = req.body;

  if (company === undefined || role === undefined || location === undefined || experience === undefined || skills === undefined) {
    return res.status(400).json({ message: "Fill required fields" });
  }

  if (company.length > 100 || role.length > 100 || location.length > 100 || skills.length > 255) {
    return res.status(400).json({ message: "Exceeded the limit" });
  }

  db.query(
    "INSERT INTO jobs (company, role, location, skills, salary, experience) VALUES (?, ?, ?, ?, ?, ?)",
    [company, role, location, skills, salary ?? null, experience],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Internal error from database" });
      }
      res.status(201).json({ id: result.insertId, company, role, location, skills, salary: salary ?? null, experience });
    }
  );
});

app.delete("/jobs/:id",(req,res)=>{
  const id = parseInt(req.params.id);
     if (isNaN(id)){
  return res.status(400).json({message:"Bad request"})
     }
     db.query("DELETE FROM jobs WHERE id = ?",[id],(err,results)=>{
      if(err){
        console.log(err);
    return    res.status(500).json({message:"Internal server error"})
      }
     if (results.affectedRows === 0){
          return res.status(404).json({message:"Id not found"})    
      }
      else{
        res.status(200).json({message:"Job deleted"})
      }
     })
})

app.put("/jobs/:id", (req, res) => {
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

  values.push(id);
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

  db.query("UPDATE jobs SET " + fields.join(", ") + " WHERE id = ?", values, (err, result) => {
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
  