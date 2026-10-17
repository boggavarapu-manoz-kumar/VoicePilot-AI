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
- MySQL 8.x (native Windows service `MySQL80` or Docker Compose)

### 1. Database Provisioning & Flyway Migrations
See [Database Operations & Setup Guide](docs/development/DATABASE_SETUP.md) for full instructions.

#### Option A: Native MySQL 8 (Recommended if MySQL service is running)
Create the database and user using the MySQL client:
```sql
CREATE DATABASE IF NOT EXISTS voicepilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'voicepilot_user'@'localhost' IDENTIFIED BY 'voicepilot_pass';
GRANT ALL PRIVILEGES ON voicepilot.* TO 'voicepilot_user'@'localhost';
FLUSH PRIVILEGES;
```

#### Option B: Docker Compose
```bash
docker compose -f infrastructure/database/docker-compose.yml up -d
```

### 2. Run Backend
```bash
cd backend
./mvnw spring-boot:run
```
Flyway automatically applies baseline migrations (`V1__init_system_baseline.sql`) and Hibernate validates the schema.
- Interactive API docs: `http://localhost:8080/api/v1/swagger-ui.html`
- Health telemetry: `http://localhost:8080/api/v1/health`

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
The frontend development server runs at `http://localhost:5173`.
