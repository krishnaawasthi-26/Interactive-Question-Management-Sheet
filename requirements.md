# Project Requirements

This document lists the runtime and tooling requirements for both parts of the repository.

## Frontend Requirements (React + Vite)

### Required runtime/tools
- Node.js 20+
- npm 10+

### Core frontend packages
- react `^19.2.0`
- react-dom `^19.2.0`
- react-router-dom `^7.9.4`
- zustand `^5.0.11`
- @hello-pangea/dnd `^18.0.1`
- vite `^7.2.4`
- tailwindcss `^4.1.18`
- eslint `^9.39.1`
- vitest `^2.1.8`

## Backend Requirements (Spring Boot)

### Required runtime/tools
- Java 17
- Maven 3.9+
- MongoDB (local or hosted instance)

### Backend framework/dependencies
- Spring Boot parent `3.4.4`
- spring-boot-starter-web
- spring-boot-starter-data-mongodb
- spring-boot-starter-validation
- spring-boot-starter-mail
- spring-security-crypto
- spring-boot-starter-test (test scope)

## Quick verification commands

### Frontend
```bash
node -v
npm -v
npm install
npm run lint
npm run test
npm run build
```

### Backend
```bash
java -version
mvn -version
cd backend
mvn test
```
