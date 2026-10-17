# VoicePilot AI

VoicePilot AI is an enterprise-oriented, AI-powered Voice CRM SaaS platform. It combines core customer relationship management workflows with intelligent outbound and inbound voice call scheduling, speech-to-text, text-to-speech, and local/remote LLM inference.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Java 21 LTS, Spring Boot 3 (Modular Monolith)
- **Database**: MySQL 8.x with Flyway schema migrations
- **ORM**: Spring Data JPA & Hibernate
- **API Style & Docs**: REST with JSON, Springdoc OpenAPI
- **Local Infrastructure**: Docker Compose

---

## Repository Structure

```
voicepilot-ai/
├── frontend/                  # React + TypeScript + Vite application
├── backend/                   # Spring Boot 3 modular monolith backend
├── infrastructure/            # Infrastructure definitions
│   └── database/              # Docker Compose & MySQL 8 configuration
├── docs/                      # Documentation suite
│   ├── architecture/          # Architecture blueprints & structure guides
│   └── development/           # Sprint planning & development guidelines
├── scripts/                   # Developer automation and validation scripts
├── .editorconfig              # Uniform code formatting & whitespace standards
├── .env.example               # Reference environment variable template
├── .gitignore                 # Version control exclusion rules
└── README.md                  # Project overview and instructions
```

For detailed architectural specifications and directory responsibilities, see:
- [System Architecture Specification](docs/architecture/ARCHITECTURE.md)
- [Project Structure & Directory Roles](docs/architecture/PROJECT_STRUCTURE.md)
- [Sprint 1 Execution Plan](docs/development/SPRINT_1.md)

---

## Planned Local Setup

### Prerequisites
- Node.js (v20+ recommended, detected v22.17.1) and npm
- Java 21 LTS
- Docker & Docker Compose (or standalone MySQL 8 server)

### 1. Database (Local Container)
When Docker is running on your machine:
```bash
docker compose -f infrastructure/database/docker-compose.yml up -d
```

### 2. Backend Service
```bash
cd backend
./mvnw spring-boot:run
```
Once started, interactive API documentation is available at `http://localhost:8080/api/v1/swagger-ui.html`.

### 3. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The frontend development server runs at `http://localhost:5173`.
