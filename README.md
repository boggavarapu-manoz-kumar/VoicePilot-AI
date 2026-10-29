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

## Local Development Startup & Verification

### Recommended Startup Sequence

#### 1. Database Provisioning
- **Option A (Native MySQL 8 Service)**: If local Windows service `MySQL80` is running:
  ```sql
  CREATE DATABASE IF NOT EXISTS voicepilot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS 'voicepilot_user'@'localhost' IDENTIFIED BY 'voicepilot_pass';
  GRANT ALL PRIVILEGES ON voicepilot.* TO 'voicepilot_user'@'localhost';
  FLUSH PRIVILEGES;
  ```
- **Option B (Docker Compose)**:
  ```bash
  docker compose -f infrastructure/database/docker-compose.yml up -d
  ```

#### 2. Start Backend Service
```bash
cd backend
./mvnw spring-boot:run
```
*(Tip: For immediate zero-setup local frontend testing without MySQL user grants, run with the in-memory profile: `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`)*

- Health Telemetry Endpoint: `http://localhost:8080/api/v1/health`
- OpenAPI Swagger Documentation: `http://localhost:8080/api/v1/swagger-ui.html`

#### 3. Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
The application will open at `http://localhost:5173`. The dashboard real-time health indicator will show `Operational` (green dot) when the backend is active and provide graceful error banners when offline.


---

## Feature Roadmap & Sprint Status

- [x] **Sprint 1: System Baseline & Foundation**
  - Modular monolith architecture with Java 21 LTS & Spring Boot 3
  - React 18, TypeScript, Vite frontend dashboard with modern dark aesthetic
  - Strict CORS policy & real-time health telemetry endpoint (`/api/v1/health`)
  - Database provisioning with MySQL 8.0 & Flyway baseline migration (`V1__init_system_baseline.sql`)
  - Automated testing with Vitest & component regression suites
- [ ] **Sprint 2: CRM Core Domain & Contact Management** (In Progress)
  - Account and Contact entities (`crm_accounts`, `crm_contacts`)
  - Flyway V2 migration, REST CRUD APIs with deterministic search & pagination
  - Interactive Contact Directory UI with modal creation, editing, and delete safeguards
- [ ] **Sprint 3: AI Voice Agents & Inbound/Outbound Scheduling**
- [ ] **Sprint 4: Multi-Tenant Tenant Isolation & RBAC Security**

---

## Security & CORS Rules

The Spring Boot backend enforces strict, narrow Cross-Origin Resource Sharing (CORS):
- **Allowed Origins**: `http://localhost:5173` and `http://127.0.0.1:5173` (configurable via `${CORS_ALLOWED_ORIGINS}`).
- Arbitrary origins (e.g., `http://unauthorized-domain.com`) receive an immediate `403 Forbidden` on preflight options requests.

---

## Troubleshooting

1. **Backend Unreachable in Frontend Dashboard**:
   - Check if Spring Boot is running on port 8080: `Test-NetConnection -ComputerName localhost -Port 8080`
   - Verify `VITE_API_BASE_URL=http://localhost:8080/api/v1` in `frontend/.env`.
2. **Access Denied for user 'voicepilot_user'@'localhost'**:
   - Verify the MySQL database grants, or launch the backend using `./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`.
3. **CORS Rejection**:
   - Ensure the frontend runs on the standard Vite port `5173`. For custom dev ports, append the port to `CORS_ALLOWED_ORIGINS` in your environment.
