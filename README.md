# COMP3123 Assignment 1 - Employee Management REST API

Secure REST API built for COMP3123 Full Stack Development I (George Brown College).
Users can sign up, log in, and manage their own employee records. Every employee belongs to the user who created it, and no user can read, change, or delete another user's employees.

**Student:** Mehmet Emin Onem (101374462)

## Tech Stack

- Node.js, Express 5
- MongoDB Atlas, Mongoose
- JWT (jsonwebtoken) for authentication
- bcrypt for password hashing
- express-validator for input validation
- Helmet for security headers
- express-rate-limit for rate limiting
- winston and morgan for logging
- dotenv for configuration

## Project Structure

```
.
├── app.js                      Express app: middleware, routes, error handling
├── server.js                   Loads env, connects to MongoDB, starts the server
├── src
│   ├── config/db.js            MongoDB connection
│   ├── controllers/            userController.js, employeeController.js
│   ├── middleware/             auth.js, validate.js, rateLimiter.js, errorHandler.js
│   ├── models/                 User.js, Employee.js
│   ├── routes/                 userRoutes.js, employeeRoutes.js
│   ├── validators/             userValidators.js, employeeValidators.js
│   └── utils/logger.js         winston logger
├── postman/                    Postman collection
├── screenshots/                Proof of testing
├── logs/sample.log             Sample log output
├── .env.example
└── README.md
```

## Setup

1. Clone the repository and install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in the values (see below).
3. Start the server:
   ```
   npm run dev      # development (nodemon)
   npm start        # production
   ```
   The API runs on `http://localhost:3000` by default.

### Environment Variables

| Variable | Description |
| --- | --- |
| `PORT` | Port the server listens on (default 3000) |
| `MONGODB_URI` | MongoDB connection string. It must end with the database name `/comp3123_assignment1`, otherwise Mongoose uses the default `test` database |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `AUTH_RATE_LIMIT_MAX` | Max signup/login requests per 15 minutes per IP (default 10). Only raise it for automated testing |

`.env` is never committed. `.env.example` shows the required keys with placeholder values.

## API Endpoints

Base path: `/api/v1`

| Method | Path | Auth | Description | Success |
| --- | --- | --- | --- | --- |
| GET | `/health` | No | Health check (status, uptime, timestamp, database state) | 200 |
| POST | `/user/signup` | No | Create a user | 201 |
| POST | `/user/login` | No | Log in with username or email, returns a JWT | 200 |
| GET | `/emp/employees` | Yes | List the logged-in user's employees | 200 |
| POST | `/emp/employees` | Yes | Create an employee | 201 |
| GET | `/emp/employees/:eid` | Yes | Get one employee | 200 |
| PUT | `/emp/employees/:eid` | Yes | Update an employee | 200 |
| DELETE | `/emp/employees?eid=<id>` | Yes | Delete an employee | 204 |

Protected routes need the header `Authorization: Bearer <token>`.

### Example requests

Signup:
```json
POST /api/v1/user/signup
{ "username": "userA", "email": "userA@mail.com", "password": "Test12345" }
```

Login (username or email):
```json
POST /api/v1/user/login
{ "username": "userA", "password": "Test12345" }
```
Response: `{ "message": "...", "token": "<jwt>" }`

Create employee:
```json
POST /api/v1/emp/employees
{
  "first_name": "John", "last_name": "Smith", "email": "john@mail.com",
  "position": "Developer", "salary": 5000, "department": "IT",
  "date_of_joining": "2026-01-15"
}
```

## Authentication Flow

1. The user signs up. The password is hashed with bcrypt (10 rounds) in a Mongoose `pre('save')` hook, so a plain-text password is never stored.
2. The user logs in. The server compares the password with the hash and returns a JWT (payload `{ id }`, expires in 1 hour). Unknown user and wrong password both return the same message ("Invalid credentials") so an attacker cannot learn which usernames exist.
3. For protected routes, `middleware/auth.js` reads the Bearer token, verifies it, loads the user from the database, and puts it on `req.user`. Missing, invalid, or expired tokens return 401.

## Ownership Enforcement

Each employee document has a required `user` field that references its creator. The user id is always taken from the verified token (`req.user._id`), never from the request body.

Every employee query includes the owner in the filter, for example:

```js
Employee.findOne({ _id: eid, user: req.user._id })
```

Consequences:
- A user only sees their own employees in the list.
- Reading, updating, or deleting another user's employee returns **404 Not Found**, exactly like an employee that does not exist.
- The client cannot set the `user` field: the controller only picks the allowed fields from the body.

**Why 404 and not 403?** A 403 would confirm that the id exists and belongs to someone else. Returning 404 for both cases leaks no information.

## Security Measures

- **bcrypt**: passwords are hashed; the password field is `select: false` and removed from JSON output.
- **JWT**: signed with `JWT_SECRET`, 1 hour expiry.
- **Helmet**: sets secure HTTP headers.
- **Rate limiting**: signup and login share one limiter (default 10 requests per 15 minutes, configurable with `AUTH_RATE_LIMIT_MAX`). All `/api` routes have a general limit of 100 requests per 15 minutes. Exceeding a limit returns 429.
- **Validation**: express-validator checks every body, param, and query (valid email, ISO date, non-negative salary, valid Mongo id, password length, and so on). Invalid input returns 400 with a list of errors.
- **Secrets**: `.env` is in `.gitignore`; no passwords, tokens, or connection strings are in the repository or logs.
- **Error handling**: a central error handler returns JSON and never leaks stack traces. Malformed JSON returns 400. Unknown routes return a JSON 404.

## Status Codes

| Code | Used for |
| --- | --- |
| 200 | Successful read, update, or login |
| 201 | Resource created |
| 204 | Employee deleted (no body) |
| 400 | Validation error, invalid id, malformed JSON |
| 401 | Missing, invalid, or expired token; wrong credentials |
| 404 | Resource not found, or not owned by the user, or unknown route |
| 409 | Duplicate username or email on signup |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error (logged, generic message returned) |

403 is intentionally not used, see "Ownership Enforcement".

## Logging

winston writes to the console and to `logs/app.log`; morgan HTTP logs go through winston. Logged events include requests, validation failures, login success and failure (user id only), authentication failures, and rate limit hits. Passwords and tokens are never logged. `logs/` is git-ignored; `logs/sample.log` is a sample kept for review.

## Testing

A Postman collection is in `postman/COMP3123_Assignment1.postman_collection.json` (39 requests, each with automated tests). Import it and run it with the Collection Runner. All 39 tests pass (`screenshots/postman-runner-39-passed.png`).

Notes for running the full collection:
- The collection variables (`baseUrl`, `tokenA`, `tokenB`, `johnId`, `janeId`) are filled automatically by the login and create requests.
- Signup and login share the rate limiter, so for a full run set `AUTH_RATE_LIMIT_MAX=100` in `.env` and restart the server. With the default limit of 10, the last requests return 429.
- The "rate limit" request is meant to be sent 11 times with the default limit: the 11th returns 429.

### Screenshots

| Area | File |
| --- | --- |
| Health check | `health-check-200.png` |
| Signup | `signup-valid-201.png`, `signup-duplicate-409.png`, `signup-invalid-email-400.png`, `signup-invalid-password-400.png` |
| Login | `login-userA-200.png` |
| Auth errors | `auth-no-token-401.png`, `auth-invalid-token-401.png` |
| Employee CRUD | `employee-create-userA-201.png`, `employee-create-userB-201.png`, `employee-list-userA-200.png`, `employee-get-by-id-200.png`, `employee-update-own-200.png`, `employee-delete-own-204.png` |
| Employee errors | `employee-invalid-id-400.png`, `employee-nonexistent-404.png` |
| Validation | `validation-employee-date-400.png`, `validation-employee-email-400.png`, `validation-employee-missing-400.png`, `validation-employee-salary-400.png` |
| Ownership (A and B cannot touch each other's data) | `ownership-A-reads-B-404.png`, `ownership-A-updates-B-404.png`, `ownership-A-deletes-B-404.png`, `ownership-B-reads-A-404.png`, `ownership-B-updates-A-404.png`, `ownership-B-deletes-A-404.png` |
| Database | `mongodb-users-hashed-password.png`, `mongodb-employees-ownership.png` |
| Security | `helmet-headers.png`, `rate-limit-429.png` |
| Logs | `logs-app-log.png` |
| Full run | `postman-runner-39-passed.png` |

## Test Accounts

For evaluation: `userA` and `userB`, both with password `Test12345`.
