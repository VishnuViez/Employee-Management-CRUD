# Apollonia Dental Practice: Employee Management

A CRUD web app (Node.js, Express, MongoDB/Mongoose) for keeping the clinic's
departments and medical staff, including which staff belong to which department.

## Run it with Docker (recommended)

Requires only [Docker Desktop](https://www.docker.com/products/docker-desktop/).

```bash
docker compose up --build -d             # build and start the app + MongoDB
docker compose exec app npm run seed     # load the 5 departments and 10 employees from the brief
```

Open <http://localhost:3020>.

Stop it with `docker compose down`. Your data is kept in a Docker volume;
`docker compose down -v` deletes it too.

## Run it without Docker

Requires Node.js 20+ and a MongoDB server on your computer.

```bash
npm install
MONGO_URL=mongodb://localhost:27017/apollonia npm run seed
MONGO_URL=mongodb://localhost:27017/apollonia npm start
```

## Project structure

```
app.js                  starts the app: connects to MongoDB, then starts the server
config/db.js            database connection
models/                 Mongoose schemas: department.js, employee.js
controllers/            business logic (one function per operation)
routes/                 maps URLs to controller functions
public/                 the web pages (HTML, CSS, browser JavaScript)
seed.js                 loads the data from the business brief
Dockerfile              builds the app image
docker-compose.yml      runs the app and MongoDB together
```

## Data model

- **departments**: `name` (required, unique), `description`
- **employees**: `firstName`, `lastName` (required), `departments` (list of department ids)

An employee can belong to several departments and a department has many
employees (**many-to-many**; e.g. Lisa Harris is in Restorative Dentistry and
Orthodontics). The link is stored once, on the employee.

## REST API

| Method | URL | Purpose |
|---|---|---|
| GET | `/api/departments` | list departments (with employee counts) |
| GET | `/api/departments/:id` | one department and its staff |
| POST | `/api/departments` | create `{ name, description }` |
| PUT | `/api/departments/:id` | update |
| DELETE | `/api/departments/:id` | delete (and remove it from its employees) |
| GET | `/api/employees` | list employees (`?department=<id>` to filter) |
| GET | `/api/employees/:id` | one employee |
| POST | `/api/employees` | create `{ firstName, lastName, departments: [ids] }` |
| PUT | `/api/employees/:id` | update |
| DELETE | `/api/employees/:id` | delete |
| POST | `/api/employees/:id/departments/:deptId` | assign to a department |
| DELETE | `/api/employees/:id/departments/:deptId` | remove from a department |

Errors come back as `{ "message": "..." }` with status 400 (invalid input),
404 (not found), 409 (duplicate department name) or 500.
