# Assignment No. 1 — University Research Opportunity Portal

A web-based application for faculty to publish and manage research openings in one place. The project includes a REST API, a MySQL database, a browser interface, and an exported Postman collection for demonstrating the required workflows.

## Assignment coverage

| Requirement | Implementation |
| --- | --- |
| Create an opportunity | `POST /api/opportunities` |
| Retrieve all opportunities | `GET /api/opportunities` |
| Retrieve one opportunity | `GET /api/opportunities/:id` |
| Update an opportunity | `PUT /api/opportunities/:id` |
| Delete an opportunity | `DELETE /api/opportunities/:id` |
| Required opportunity fields | Title, description, research area, faculty member, department, skills, positive whole-number positions, deadline, and Open/Closed status |
| Frontend workflows | List, details, create, edit, close, delete, success/error messages, and required-field validation |
| API testing | Automated Node.js tests and an ordered Postman collection |

The API returns `200 OK` for successful reads, updates, and deletes; `201 Created` for successful creates; `400 Bad Request` for invalid input; `404 Not Found` when an opportunity does not exist; and `500 Internal Server Error` for database or server errors.

## Technology

- **Backend:** Node.js, Express, MySQL2
- **Database:** MySQL
- **Frontend:** HTML, CSS, JavaScript, Bootstrap 5
- **API testing:** Postman and Node.js built-in test runner

## Project structure

```text
.
├── backend/
│   ├── app.js                       # REST API routes
│   ├── app.test.js                  # Automated API tests using a mock database
│   ├── opportunity-validation.js    # Request validation
│   ├── server.js                    # MySQL connection and HTTP server
│   ├── package.json
│   └── .env.example
├── database/
│   └── schema.sql                   # Database and table setup
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
├── postman_collection.json          # End-to-end API demonstration
└── README.md
```

## Requirements

- Node.js 18 or newer and npm
- MySQL Server 5.7 or newer
- Postman (only if running the exported API demonstration)

## Installation and setup

1. Clone the public assignment repository and open its directory:

   ```bash
   git clone https://github.com/Alamzeb588/university-research-opportunity-portal-assignment-1.git
   cd university-research-opportunity-portal-assignment-1
   ```

2. Start your MySQL Server, then create the project database and table:

   ```bash
   mysql -u root -p < database/schema.sql
   ```

   The SQL file creates the `research_portal` database and the `opportunities` table. It does not insert demonstration rows; the Postman collection creates its own test records.

3. Create the backend environment file:

   ```bash
   cp backend/.env.example backend/.env
   ```

   Edit `backend/.env` and enter the credentials for your local MySQL account:

   ```dotenv
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=research_portal
   PORT=3000
   ```

   Keep real `.env` files private. They are excluded from Git; only `.env.example` is committed.

4. Install the Node.js dependencies and start the application:

   ```bash
   cd backend
   npm install
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000). The Express server hosts both the frontend and API. Leave the server running while using the application.

Stop the server with `Ctrl+C`. To run it again, start MySQL if needed, then run `npm start` from the `backend` directory.

## API reference

Base URL: `http://localhost:3000`

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/opportunities` | Create an opportunity |
| `GET` | `/api/opportunities` | List all opportunities |
| `GET` | `/api/opportunities/:id` | Get all fields for one opportunity |
| `PUT` | `/api/opportunities/:id` | Replace an opportunity's editable fields |
| `DELETE` | `/api/opportunities/:id` | Delete an opportunity |

Create and update requests use JSON. All fields other than `status` are required; status defaults to `Open` when omitted:

```json
{
  "title": "AI in Healthcare",
  "description": "Research using machine learning for medical imaging.",
  "research_area": "Artificial Intelligence",
  "faculty_name": "Dr. Ahmed Khan",
  "department": "Computer Science",
  "required_skills": "Python, Machine Learning",
  "positions": 3,
  "deadline": "2027-12-31",
  "status": "Open"
}
```

`positions` must be a positive whole number. `deadline` must be a real date in `YYYY-MM-DD` format. `status` accepts only `Open` or `Closed`. Invalid requests receive a `400` response with a message and validation errors. A syntactically invalid JSON request also receives `400`.

## Testing

### Automated API tests

The API tests use Node.js's built-in test runner and an in-memory mock database, so MySQL does not need to be running for this check:

```bash
cd backend
npm test
```

The tests exercise create, list, retrieve, update, delete, deleted-record `404`, malformed/invalid input `400`, and database-error `500` behavior.

### Postman demonstration against MySQL

1. Complete the database setup and start the application.
2. Import [`postman_collection.json`](./postman_collection.json) into Postman.
3. Run the collection requests in order. The create requests save their generated IDs to collection variables, so the remaining requests target the records just created instead of relying on fixed IDs.
4. The ordered requests create three opportunities, list them, retrieve one by ID, update it, close another, delete the third, verify the deleted record returns `404`, and submit invalid data to verify `400` validation.

## GitHub repository

[https://github.com/Alamzeb588/university-research-opportunity-portal-assignment-1](https://github.com/Alamzeb588/university-research-opportunity-portal-assignment-1)

The repository is public for instructor access. Do not commit database passwords, access tokens, or other credentials.

## Author

- **Name:** Alam Zeb
- **Roll Number:** 22P-9266
- **Class:** BAi-5A
