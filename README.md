# VoicePilot AI

VoicePilot AI is an enterprise-grade, AI-powered Voice CRM SaaS platform.

## Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Java 21, Spring Boot 3 (Modular Monolith)
- **Database**: MySQL 8 with Flyway schema migrations
- **Infrastructure**: Docker Compose

## Repository Layout

- `frontend/`: React + TypeScript frontend application.
- `backend/`: Spring Boot modular monolith backend.
- `docs/`: Technical specifications, architectural designs, and coding conventions.
  - [Architecture Specification](docs/ARCHITECTURE.md)
  - [Development Conventions](docs/CONVENTIONS.md)
  - [Sprint Roadmap](docs/SPRINT_PLAN.md)
- `docker-compose.yml`: Local infrastructure services (MySQL 8).

## Quick Start (Development)

### 1. Start Local Database
```bash
docker compose up -d
```

### 2. Run Backend
```bash
cd backend
./mvnw spring-boot:run
```
Swagger UI will be accessible at: `http://localhost:8080/swagger-ui.html`

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend development server will start at: `http://localhost:5173`
