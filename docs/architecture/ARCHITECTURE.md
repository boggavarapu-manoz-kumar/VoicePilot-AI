# VoicePilot AI - System Architecture

## 1. Overview
VoicePilot AI is an enterprise-oriented, AI-powered Voice CRM SaaS platform. The system is designed to provide robust CRM functionality (accounts, leads, contacts, communications) coupled with intelligent voice campaign scheduling, telephony orchestration, speech processing, and RAG-driven conversational AI.

---

## 2. Core Architectural Pillars

```
+-------------------------------------------------------------+
|                      React Frontend                         |
|             (TypeScript, Vite, Modern SPA)                  |
+-------------------------------------------------------------+
                              |
                     REST / JSON APIs
                              |
+-------------------------------------------------------------+
|               Spring Boot Modular Monolith                  |
|                      (Java 21 LTS)                          |
|                                                             |
|  [Security/Auth]    [CRM Module]      [Campaign Engine]     |
|                                                             |
|  [Telephony SPI Bridge]              [AI Orchestration SPI] |
+-------------------------------------------------------------+
           |                                     |
   Spring Data JPA / Flyway              REST / gRPC / Events
           |                                     |
+-----------------------+             +-----------------------+
|        MySQL 8        |             | Future AI & Telephony |
|  Relational Database  |             |  Independent Services |
+-----------------------+             +-----------------------+
```

### 2.1. Frontend Architecture
- **Tech Stack**: React 18+, TypeScript, Vite.
- **Role**: Single Page Application (SPA) providing an interactive user interface for CRM contacts, call logs, analytics, and campaign scheduling.
- **Communication**: Interacts with the backend strictly via standardized REST/JSON endpoints over HTTPS/HTTP.
- **State & Data Handling**: Typed API clients with explicit request/response schemas.

### 2.2. Backend Modular Monolith
- **Tech Stack**: Java 21, Spring Boot 3.x.
- **Role**: Serves as the central business engine handling authentication, CRM logic, validation, transaction boundaries, and orchestration.
- **Design Pattern**: **Modular Monolith**. Rather than fragmenting into premature microservices with distributed transaction complexity, domain boundaries are isolated within dedicated Java packages/modules.
- **API Contracts**: RESTful JSON endpoints documented using Springdoc OpenAPI.

### 2.3. Persistence & Database Strategy
- **Tech Stack**: MySQL 8.x, Spring Data JPA, Hibernate.
- **Schema Management**: Flyway database migrations ensure deterministic, version-controlled schema evolution across local, testing, and production environments.
- **Data Integrity**: Foreign key constraints, ACID compliance, and audited base entities (`createdAt`, `updatedAt`).

### 2.4. Separation of Business Backend & AI / Voice Services
- Real-time voice processing (SIP, WebRTC, telephony webhooks) and heavy AI inference (local LLMs, Whisper STT, TTS, vector indexing) carry fundamentally different performance and runtime characteristics than standard transactional CRM operations.
- **Contract Boundary (SPI)**: The Spring Boot monolith defines clean Service Provider Interfaces (SPI) for AI and telephony operations.
- **Evolutionary Path**: Initial phases use modular abstractions within the backend. As throughput increases, these capabilities will run as separately deployable microservices/sidecars (e.g., Python or Go services for local model inference and media streaming) communicating asynchronously or via high-performance RPC.

---

## 3. Local Development & Environment Configuration

- **Configuration Externalization**: All environment-dependent parameters (database credentials, ports, external service endpoints) are driven by environment variables.
- **Configuration Templates**: Non-sensitive defaults and variables are documented in `.env.example`.
- **Infrastructure Isolation**: Local supporting services (MySQL 8) are managed via Docker Compose in `infrastructure/database/docker-compose.yml`.
- **Secret Hygiene**: Real environment secrets (`.env`, private keys) are strictly ignored by version control.
