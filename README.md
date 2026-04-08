# Interactive Question Management Sheet

A local-first question sheet manager for organizing **topics → subtopics → questions** with import/export support, auth flows, and sync-ready architecture.

**Live frontend:** https://interactive-question-management-she-gamma.vercel.app/

## Project overview

This repository contains:
- A **React + Vite frontend** at the repo root.
- A **Spring Boot backend** in `backend/` for authentication and API services.
- A **MongoDB datastore** for users and sheet data.

The app is designed to work well for day-to-day editing while supporting progressive backend integration and online sync workflows.

## Architecture overview

The current architecture follows a clear client/store/API/server split:

```text
[React Frontend]
       |
       v
[Zustand Store] <-> [API Layer]
                        |
                        v
              [Spring Boot Backend]
                        |
                        v
                    [MongoDB]
```

### Components
- **React frontend:** rendering, routing, interaction flows.
- **Zustand store:** local UI/domain state management.
- **API layer:** encapsulated HTTP calls and sync/auth integration points.
- **Spring Boot backend:** REST APIs, validation, authentication logic.
- **MongoDB:** persistent storage for backend-managed data.

## Frontend stack

- React 19
- Vite 7
- Zustand 5
- React Router DOM 7
- Tailwind CSS 4
- ESLint 9

## Backend stack

- Java 17
- Spring Boot 3.4
- Spring Web
- Spring Data MongoDB
- Spring Validation
- Spring Security Crypto
- Maven

## Environment variables

### Frontend (`.env`)

Copy and update:

```bash
cp .env.example .env
```

Variables:
- `VITE_API_BASE_URL` (default: `http://localhost:8080`)
- `VITE_SYNC_API_BASE_URL` (default: `/api/sync/outbox`)
- `VITE_PUBLIC_SHEET_API_BASE_URL` (default: public sheet endpoint)

### Backend (`backend/.env`)

```bash
cd backend
cp .env.example .env
```

Variables:
- `MONGODB_URI` (default example: `mongodb://localhost:27017/iqms`)
- `APP_AUTH_SECRET` (required for real deployments)

## Local development steps

### 1) Start backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs at `http://localhost:8080`.

### 2) Start frontend

```bash
cd /workspace/Interactive-Question-Management-Sheet
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Testing steps

### Frontend checks

```bash
npm run lint
npm run build
```

### Backend checks

```bash
cd backend
mvn test
```

## Deployment notes

- Frontend is currently deployed on **Vercel** (see live link above).
- For production deployments, set environment variables in your hosting platform instead of hardcoding config.
- Backend can be deployed to any Java-compatible platform (Render, Railway, Fly.io, ECS, etc.) with:
  - Java 17 runtime
  - `MONGODB_URI` configured
  - strong `APP_AUTH_SECRET` configured
- Ensure CORS/API base URLs are aligned between deployed frontend and backend environments.

## Known improvements made

Recent refactors improved maintainability and onboarding:
- Migrated from custom hash routing to **React Router + BrowserRouter**.
- Introduced route-guard patterns for protected/public-only auth flows.
- Consolidated routing helpers into a dedicated routes service.
- Clarified local-first architecture direction (state, persistence, sync pipeline).
- Standardized environment-driven runtime configuration for frontend/backend.
