# Interactive Question Management Sheet

deployment link : https://interactive-question-management-she-gamma.vercel.app/

This project now contains:

- A **React + Vite frontend** (`/`) for question sheet UI.
- A **Spring Boot backend** (`/backend`) for authentication APIs.
- A **MongoDB database** for users/sheets.

---

## Environment configuration

Backend Mongo connection now supports an environment variable:

- `MONGODB_URI` (recommended)
- fallback default: `mongodb://localhost:27017/iqms`

Configured in `backend/src/main/resources/application.properties` as:

```properties
spring.data.mongodb.uri=${MONGODB_URI:mongodb://localhost:27017/iqms}
```

---

## Run the project

### 1) Start backend (Spring Boot)

Open terminal 1:

```bash
cd backend
export MONGODB_URI="mongodb+srv://sheet:samplepass1@sheet.d6mwyaj.mongodb.net/iqms?retryWrites=true&w=majority&appName=sheet"
mvn spring-boot:run
```

Backend starts at: `http://localhost:8080`

> If you want local Mongo instead, skip `export MONGODB_URI=...` and keep the default local URI.

### 2) Start frontend (React + Vite)

Open terminal 2:

```bash
cd /workspace/Interactive-Question-Management-Sheet
npm install
npm run dev
```

Frontend starts at: `http://localhost:5173`

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

### Login

```bash
curl --location 'http://localhost:8080/api/auth/login' \
--header 'Content-Type: application/json' \
--data-raw '{
  "email": "test@example.com",
  "password": "secret123"
}'
```

---

## Scripts

### Frontend

```bash
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
