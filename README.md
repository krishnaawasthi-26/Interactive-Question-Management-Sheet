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


## Requirements document

For a consolidated frontend/backend requirement list, see [`requirements.md`](./requirements.md).

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
- `VITE_RAZORPAY_KEY_ID` (Razorpay publishable key id; optional fallback if backend does not return key id)

### Backend (`backend/.env`)

```bash
cd backend
cp .env.example .env
```

Variables:
- `MONGODB_URI` (default example: `mongodb://localhost:27017/create-sheets`)
- `APP_AUTH_SECRET` (required for real deployments)
- `APP_PAYMENT_RAZORPAY_ENABLED` (`true` to require and enable Razorpay payments)
- `RAZORPAY_KEY_ID` (Razorpay API key id, safe to share with frontend through backend response)
- `RAZORPAY_KEY_SECRET` (Razorpay API secret, **keep only on backend/server env**)

## How to get each required credential/service

Use the provided sample files first:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Then fill values service by service:

1. **MongoDB (`MONGODB_URI`)**
   - Create a cluster in MongoDB Atlas (or run local MongoDB).
   - In Atlas: Database → Connect → Drivers → copy connection string.
   - Replace username, password, and database name in `backend/.env`.

2. **Auth secret (`APP_AUTH_SECRET`)**
   - Generate a strong random secret (32+ chars).
   - Example:
     ```bash
     openssl rand -base64 48
     ```
   - Paste output into `APP_AUTH_SECRET`.

3. **Google login (`APP_AUTH_GOOGLE_CLIENT_ID`)**
   - Open Google Cloud Console → APIs & Services → Credentials.
   - Create OAuth Client ID → **Web application**.
   - Add origin: `http://localhost:5173` for local development.
   - Copy Client ID (`*.apps.googleusercontent.com`) to `APP_AUTH_GOOGLE_CLIENT_ID`.

4. **OTP email / SMTP (`APP_MAIL_*`)**
   - Use your mail provider SMTP credentials.
   - For Gmail:
     - `APP_MAIL_HOST=smtp.gmail.com`
     - `APP_MAIL_PORT=587`
     - `APP_MAIL_AUTH=true`
     - `APP_MAIL_STARTTLS=true`
     - Use an App Password in `APP_MAIL_PASSWORD`.
   - Set `APP_MAIL_ENABLED=true` only after all mail fields are configured.

5. **Razorpay (`APP_PAYMENT_RAZORPAY_ENABLED`, `RAZORPAY_*`, `VITE_RAZORPAY_KEY_ID`)**
   - Create Razorpay account → Dashboard → API Keys.
   - Generate test keys first.
   - Put:
     - `RAZORPAY_KEY_ID` in `backend/.env`
     - `RAZORPAY_KEY_SECRET` in `backend/.env` (never expose publicly)
     - `VITE_RAZORPAY_KEY_ID` in frontend `.env` (publishable key id)
   - Enable payments by setting `APP_PAYMENT_RAZORPAY_ENABLED=true`.

6. **Optional frontend-only vars**
   - `VITE_API_TIMEOUT_MS`: request timeout (default `12000`).
   - `VITE_WEB_PUSH_PUBLIC_KEY`: required only for push subscription support.

### Razorpay premium flow (secure)

- Frontend opens `checkout.razorpay.com` only after requesting an order from backend.
- Backend creates Razorpay order, stores pending order in MongoDB, and verifies signature + payment details before activating premium.
- Premium is activated only after backend verification succeeds.


### Google login configuration (required)

Google Sign-In now uses backend runtime configuration only (no built-in sample credentials).

Required backend env vars:

- `APP_AUTH_GOOGLE_CLIENT_ID` (Web OAuth client id from Google Cloud Console)
- `APP_MAIL_ENABLED` (`true` to allow OTP email delivery)
- `APP_MAIL_HOST`
- `APP_MAIL_PORT` (typically `587` for STARTTLS)
- `APP_MAIL_USERNAME`
- `APP_MAIL_PASSWORD`
- `APP_MAIL_FROM`

Optional backend env vars:

- `APP_AUTH_OTP_BYPASS_KEY` (only for OTP testing; never exposed to frontend)
- `APP_MAIL_FROM_NAME` (default: `IQMS`)
- `APP_MAIL_AUTH` (default: `true`)
- `APP_MAIL_STARTTLS` (default: `true`)

Run backend with explicit env values:

```bash
cd backend
APP_AUTH_GOOGLE_CLIENT_ID="<your-web-client-id>.apps.googleusercontent.com" \
APP_MAIL_ENABLED="true" \
APP_MAIL_HOST="smtp.gmail.com" \
APP_MAIL_PORT="587" \
APP_MAIL_USERNAME="<smtp-username>" \
APP_MAIL_PASSWORD="<smtp-password-or-app-password>" \
APP_MAIL_FROM="<from-email>" \
APP_MAIL_FROM_NAME="IQMS" \
APP_AUTH_OTP_BYPASS_KEY="<optional-otp-bypass-key>" \
MONGODB_URI="<your-mongodb-uri>" \
mvn spring-boot:run
```

Then start frontend:

```bash
cd /workspace/Interactive-Question-Management-Sheet
npm run dev
```

Google setup checklist (for `Error 401: invalid_client` / `no registered origin`):

- Create an OAuth **Web application** credential (not Android/iOS/Desktop).
- Add your frontend URL to **Authorized JavaScript origins** (for local dev: `http://localhost:5173`).
- Use that same client ID in backend env var `APP_AUTH_GOOGLE_CLIENT_ID`.

OTP note:

- OTP delivery now uses SMTP (`OtpDeliveryService`) and fails the request if email delivery fails.
- For Gmail, use an App Password (not your normal account password) in `APP_MAIL_PASSWORD`.

## Local development steps

### 1) Start backend

```bash
cd backend
mvn spring-boot:run
```

Backend runs at `http://localhost:8080`.

If Maven reports a missing file like `backend/backend/pom.xml`, you are launching from the wrong directory (or with an extra `-f backend/pom.xml`). Run from the repository root exactly as shown above (`cd backend` once, then `mvn spring-boot:run`).

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

### Vercel routing and API proxy

If you deploy the frontend on Vercel with React Router `BrowserRouter`, add `vercel.json` rewrites so deep links (like `/login`) load `index.html` and `/api/*` calls are proxied to backend.

This repository includes:
- `/api/* -> http://15.207.72.139:8080/api/*`
- `/* -> /index.html`

If your backend host changes, update `vercel.json` before deploying.


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
