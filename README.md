# Job Application Tracker API

A RESTful API for managing job applications with **user authentication, protected routes, and MySQL persistence**.

The project lets users create an account, sign in, and manage their own job application records. Each authenticated user's job data and application statistics are scoped to their account.

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

## Features

- **User registration** with password hashing using bcrypt.
- **User login** with password verification and JWT generation.
- **Protected job routes** that require a valid bearer token.
- **User-specific records** — users can only access and modify their own job applications.
- **Job application CRUD** — create, read, update, and delete records.
- **Application statistics** grouped by status.
- **MySQL persistence** using parameterized queries.
- **Input validation** for job fields and application statuses.

## Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express 5 | REST API and routing |
| MySQL | Relational database |
| mysql2 | MySQL connection and queries |
| bcrypt | Password hashing and comparison |
| jsonwebtoken | JWT creation and verification |
| dotenv | Environment variable configuration |
| cors | Cross-origin resource sharing |

## Getting Started

### Prerequisites

- Node.js 18 or later
- MySQL server
- npm

### 1. Clone the repository

```bash
git clone https://github.com/hamzah697/Job-finder.git
cd Job-finder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_long_random_secret
```

Use your own MySQL credentials and a strong, private JWT secret. **Do not commit your `.env` file or expose your secrets.**

### 4. Set up the database

Create a MySQL database and configure the `users` and `jobs` tables to match the columns used by the API.

The API expects:

- `users`: `id`, `username`, `password`
- `jobs`: `id`, `user_id`, `company`, `role`, `location`, `skills`, `salary`, `experience`, `status`, `date_applied`

The `jobs.user_id` column associates each application with its owner.

### 5. Start the server

```bash
node index.js
```

The API runs at:

```
http://localhost:5000
```

A successful request to `GET /` returns `App is running!`.

## API Reference

**Base URL:** `http://localhost:5000`

### Authentication

These routes are public and do not require a token.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register a new user |
| POST | `/login` | Authenticate and receive a JWT |

#### Register

`POST /signup`

Request body:

```json
{
  "username": "hamzah",
  "password": "your_password"
}
```

- Username must be a string of up to 50 characters.
- Password must be 8–72 characters.
- Passwords are hashed with bcrypt before being stored.
- A duplicate username returns `409 Conflict`.

#### Login

`POST /login`

Request body:

```json
{
  "username": "hamzah",
  "password": "your_password"
}
```

Successful response:

```json
{
  "token": "your_jwt_token"
}
```

The JWT expires after **1 hour**.

### Protected routes

All `/jobs` endpoints require a valid JWT.

Include this header in your requests:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

| Method | Endpoint | Description |
|---|---|---|
| GET | `/jobs` | Get the authenticated user's jobs |
| GET | `/jobs/stats` | Get the user's application counts grouped by status |
| GET | `/jobs/:id` | Get one of the user's job applications |
| POST | `/jobs` | Create a job application |
| PUT | `/jobs/:id` | Update a job application |
| DELETE | `/jobs/:id` | Delete a job application |

### Job application fields

| Field | Description |
|---|---|
| `company` | Company name (required) |
| `role` | Position or job title (required) |
| `location` | Job location (required) |
| `experience` | Experience requirement (required) |
| `skills` | Relevant skills (required) |
| `salary` | Salary information (optional) |
| `status` | Application status |
| `dateApplied` | Application date returned by the API |

Supported application statuses:

`Applied` · `Interview` · `Offer` · `Rejected` · `Accepted` · `Waitlisted`

### Create a job application

`POST /jobs`

Request body:

```json
{
  "company": "Acme",
  "role": "Frontend Developer",
  "location": "Remote",
  "experience": 1,
  "skills": "React, JavaScript, CSS",
  "salary": 50000
}
```

The authenticated user's ID is taken from the verified token and associated with the new record.

### Update a job application

`PUT /jobs/:id`

Send only the fields you want to update:

```json
{
  "status": "Interview"
}
```

### Get application statistics

`GET /jobs/stats`

Returns the authenticated user's application totals grouped by status.

Example response:

```json
[
  {
    "status": "Applied",
    "total": 5
  },
  {
    "status": "Interview",
    "total": 2
  }
]
```

The values above are illustrative.

## Authentication Flow

1. A user registers through `POST /signup`.
2. The password is hashed with bcrypt and stored in MySQL.
3. The user signs in through `POST /login`.
4. The API compares the submitted password with the stored hash.
5. On successful login, the API signs a JWT containing the user's ID.
6. Protected routes verify the token and use that ID to scope database queries.

## Project Structure

```text
Job-finder/
├── index.js
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

## Current Scope

The repository currently contains the backend API. A frontend dashboard is not included in this repository yet.

## Future Improvements

- [ ] Add a frontend dashboard for managing applications.
- [ ] Add filtering and search for job applications.
- [ ] Add pagination for larger application lists.
- [ ] Add automated API tests.
- [ ] Deploy the API and connect it to a production database.

---

<div align="center">

Built by **Muhammad Hamzah**

[GitHub Repository](https://github.com/hamzah697/Job-finder)

</div>
