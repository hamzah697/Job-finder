import express  from "express";
const app = express();
app.use(express.json());

let jobs = [
  { id: 1, company: "Acme", role: "Frontend Developer", salary: 50000, location: "Remote", experience: 1, skills: "React, CSS", status: "Applied", dateApplied: "2026-11-10" },
  { id: 2, company: "Globex", role: "Backend Intern", salary: null, location: "Karachi", experience: 0, skills: "Node, Express", status: "Interview", dateApplied: "2026-11-11" }
];

app.get("/", (req, res) => {
    res.send("App is running!")
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})

app.get("/jobs", (req, res) => {
    res.json(jobs);
});
 const validStatuses = ["Applied", "Interview", "Offer", "Rejected", "Accepted", "Waitlisted"];

 
app.get("/jobs/stats",(req,res)=>{
  const count = {};
   jobs.forEach(job => {
  count[job.status] = (count[job.status] || 0) + 1;
    });
    res.json(count)
})

app.get("/jobs/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const jobid = jobs.find(job => job.id === id);
  if (jobid) {
    res.json(jobid);
  } else {
    res.status(404).json({ message: "Job not found" });
  }
  
})

app.post("/jobs",(req,res) => {
  const { company, role, salary, location, experience, skills } = req.body;
     const maxid = jobs.length > 0 ? Math.max(...jobs.map(job => job.id)) : 0;
  const newJob = {
    id: maxid + 1,
    company,
    role,
    salary,
    location,
    experience,
    skills,
    status: "Applied",
    dateApplied: new Date().toISOString().split("T")[0]
  };
  if(newJob.company && newJob.role && newJob.location && newJob.experience !== undefined && newJob.skills) {
        jobs.push(newJob);
        res.status(201).json(newJob);  
  } return res.status(400).json({ message: "Missing required fields" });
  
});

app.delete("/jobs/:id",(req,res)=>{
  const id = parseInt(req.params.id)

    const jobindex = jobs.findIndex(job => job.id === id)
    if(jobindex === -1){
   return res.status(404).json({message:"INVALID ID"})
    }
     jobs.splice(jobindex,1),
    res.status(200).json({message:"Successfully Deleted"})  ;  
})
  app.put("/jobs/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const job = jobs.find(job => job.id === id);

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  const { company, role, salary, location, experience, skills, status } = req.body;
   if (status !== undefined && !validStatuses.includes(status)){
    return res.status(400).json({message:"Invalid Status"})
  }  

  if (company !== undefined) job.company = company;
  if (role !== undefined) job.role = role;
  if (salary !== undefined) job.salary =  salary;
  if (location !== undefined) job.location =location;
  if (experience !== undefined) job.experience = experience;
  if (skills !== undefined) job.skills = skills;
  if (status !== undefined) job.status = status
  res.status(200).json(job);
});
  