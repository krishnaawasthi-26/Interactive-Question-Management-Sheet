# Interactive Question Management Sheet

deployment link : https://interactive-question-management-she-gamma.vercel.app/

This project contains:

- A **React + Vite frontend** (`/`) for question sheet UI.
- A **Spring Boot backend** (`/backend`) for authentication APIs.
- A **MongoDB database** for users/sheets.

---

## Environment configuration

Use environment variables only for runtime configuration.

### Frontend (`/.env`)

Copy the example file and adjust as needed:

```bash
cp .env.example .env
```

Supported frontend variables:

- `VITE_API_BASE_URL` (default in example: `http://localhost:8080`)
- `VITE_SYNC_API_BASE_URL` (default in example: `/api/sync/outbox`)
- `VITE_PUBLIC_SHEET_API_BASE_URL` (default in example points to public sheet API)

### Backend (`/backend/.env`)

Copy the backend example file and set values:

```bash
cd backend
cp .env.example .env
```

Supported backend variables:

- `MONGODB_URI` (recommended)
  - Example placeholder for cloud MongoDB:
    `MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority`
  - Local default example:
    `MONGODB_URI=mongodb://localhost:27017/iqms`
- `APP_AUTH_SECRET` (required for non-dev deployments)

Configured in `backend/src/main/resources/application.properties` as:

```properties
spring.data.mongodb.uri=${MONGODB_URI:mongodb://localhost:27017/iqms}
app.auth.secret=${APP_AUTH_SECRET:change-me-super-secret-key}
```

---

## Run the project

### 1) Start backend (Spring Boot)

Open terminal 1:

```bash
cd backend
mvn spring-boot:run
```

Backend starts at: `http://localhost:8080`

### 2) Start frontend (React + Vite)

Open terminal 2:

```bash
cd /workspace/Interactive-Question-Management-Sheet
npm install
npm start
```

Frontend starts at: `http://localhost:5173`

Frontend is configured to bind to `0.0.0.0:5173` with strict port mode, so if 5173 is taken Vite fails fast instead of silently switching ports.

---

## Quick API checks

### Sign up

```bash
curl --location 'http://localhost:8080/api/auth/signup' \
--header 'Content-Type: application/json' \
--data-raw '{
  "name": "Test User",
  "email": "test@example.com",
  "password": "your-password-here"
}'
```

### Login

```bash
curl --location 'http://localhost:8080/api/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "test@example.com",
  "password": "your-password-here"
}'
```

---

## Scripts

### Frontend

```bash
npm start
npm run dev
npm run build
npm run preview
npm run lint
```

### Backend

```bash
cd backend
mvn spring-boot:run
mvn test
```
