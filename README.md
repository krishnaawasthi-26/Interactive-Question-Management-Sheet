# Interactive Question Management Sheet

deployment link : https://interactive-question-management-she-gamma.vercel.app/

This project now contains:

- A **React + Vite frontend** (`/`) for question sheet UI.
- A **Spring Boot backend** (`/backend`) for authentication APIs.
- A **local MongoDB database** for user accounts.

---

## What was fixed

The login/sign-up flow now uses a real backend API instead of only browser local storage.

- Creates users in MongoDB.
- Logs in only if account exists.
- Returns clear errors for:
  - account not found
  - wrong password
  - duplicate account
  - validation issues
- Shows loading states in the UI while request is in progress.

---

## Backend API (Spring Boot + MongoDB)

Base URL: `http://localhost:8080`

### Endpoints

- `POST /api/auth/signup`
  - Body: `{ "name": "...", "email": "...", "password": "..." }`
- `POST /api/auth/login`
  - Body: `{ "email": "...", "password": "..." }`

### Tech

- Spring Boot 3
- Spring Web
- Spring Data MongoDB
- Bean Validation

Mongo connection is configured in:

- `backend/src/main/resources/application.properties`

Default DB URI:

- `mongodb://localhost:27017/iqms`

---

### Use MongoDB Atlas (online MongoDB)

If you are using an Atlas URI, set it before starting the backend:

```bash
export MONGODB_URI="mongodb+srv://sheet:samplepass1@sheet.d6mwyaj.mongodb.net/iqms?retryWrites=true&w=majority&appName=sheet"
cd backend
mvn spring-boot:run
```

Notes:
- Include a database name in the URI path (for example `/iqms`).
- In Atlas, allow your client IP in **Network Access** (or `0.0.0.0/0` for testing).
- Ensure the Atlas database user (`sheet`) has read/write permission.


## Run the program (step by step)

## 1) Start MongoDB locally

If you already have MongoDB as a service, ensure it is running on port `27017`.

Example (Linux/macOS):

```bash
mongod --dbpath ~/data/db
```

Or with Docker:

```bash
docker run --name iqms-mongo -p 27017:27017 -d mongo:7
```

## 2) Start backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs on `http://localhost:8080`.

## 3) Start frontend (new terminal)

```bash
cd /workspace/Interactive-Question-Management-Sheet
npm install
npm run dev
```

Frontend runs on Vite default URL (`http://localhost:5173`).

---

## Quick API checks

### Sign up

```bash
curl --location 'http://localhost:8080/api/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
  "name": "Test User",
  "email": "test@example.com",
  "password": "secret123"
}'
```

### Login (existing account)

```bash
curl --location 'http://localhost:8080/api/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "test@example.com",
  "password": "secret123"
}'
```

### Login (non-existing account → expected error)

```bash
curl --location 'http://localhost:8080/api/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "nouser@example.com",
  "password": "secret123"
}'
```

---

## Frontend scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Backend scripts

```bash
cd backend
mvn spring-boot:run
mvn test
```
