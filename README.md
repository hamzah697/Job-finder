# Job Application Tracker API

A REST API for tracking job applications, built with Node.js and Express.
Currently stores data in memory. MySQL and user authentication are coming next.

## Setup

```
npm install
node index.js
```

The server runs on `http://localhost:3000`.

## Routes

| Method | URL | What it does |
|---|---|---|
| GET | `/jobs` | Get all jobs |
| GET | `/jobs?status=Interview` | Get jobs filtered by status |
| GET | `/jobs/stats` | Get the number of jobs per status |
| GET | `/jobs/:id` | Get one job |
| POST | `/jobs` | Add a job |
| PUT | `/jobs/:id` | Update a job (only the fields you send) |
| DELETE | `/jobs/:id` | Delete a job |

## Job fields

`company`, `role`, `location`, `experience`, `skills` (required),
`salary` (optional), `status`, `dateApplied` (set by the server).

Valid statuses: Applied, Interview, Offer, Rejected, Accepted, Waitlisted.

## Example

POST `/jobs`
```json
{
  "company": "Acme",
  "role": "Frontend Developer",
  "location": "Remote",
  "experience": 1,
  "skills": "React, CSS"
}
```

## Roadmap

- [ ] MySQL database
- [ ] Signup and login with hashed passwords and tokens
- [ ] Each user sees only their own jobs
- [ ] Next.js frontend
- [ ] Deployment
