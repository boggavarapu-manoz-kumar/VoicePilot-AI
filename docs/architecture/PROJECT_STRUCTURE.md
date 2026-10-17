# VoicePilot AI - Project Structure & Directory Responsibilities

This document defines the organization of the repository and the specific role of each top-level directory and subdirectory.

```
voicepilot-ai/
├── frontend/                  # Client-side user interface application
├── backend/                   # Core business logic and API service
├── infrastructure/            # Local and cloud environment infrastructure definitions
│   └── database/              # Database provisioning, scripts, and compose files
├── docs/                      # Architectural, development, and operational documentation
│   ├── architecture/          # High-level architecture, contracts, and system designs
│   └── development/           # Sprint planning, dev setup, and workflow guidelines
├── scripts/                   # Automation scripts for setup, validation, and maintenance
├── .env.example               # Reference environment variable template
├── .editorconfig              # Cross-editor formatting and whitespace rules
├── .gitignore                 # Version control exclusion rules
└── README.md                  # Project overview, tech stack, and onboarding guide
```

---

## Directory Responsibilities

### `frontend/`
- **Purpose**: Houses the React single-page application built with TypeScript and Vite.
- **Responsibilities**:
  - UI components, views, and dashboards for CRM data, campaigns, and call telemetry.
  - Client-side routing and state management.
  - Typed API service integrations calling backend REST endpoints.
- **Lifecycle**: Independently built and bundled via `npm run build`, producing static artifacts in `dist/`.

### `backend/`
- **Purpose**: The central Spring Boot modular monolith.
- **Responsibilities**:
  - REST API controllers exposing JSON endpoints documented via OpenAPI.
  - Domain business services and transaction management.
  - Data access via Spring Data JPA and Hibernate.
  - Flyway migration scripts in `src/main/resources/db/migration/`.
  - Abstraction boundaries (SPI) for AI services and telephony integration.
- **Lifecycle**: Built and tested via the Maven wrapper (`./mvnw`).

### `infrastructure/`
- **Purpose**: Defines environment provisioning, runtime containers, and deployment automation.
  - `infrastructure/database/`: Contains Docker Compose files (`docker-compose.yml`) and database initialization assets for running MySQL 8 locally.
  - *Future extensions*: Will house deployment manifests, reverse proxies, and cloud infrastructure as code (IaC).

### `docs/`
- **Purpose**: Authoritative project documentation kept in sync with code.
  - `docs/architecture/`: System design, module boundaries, database schemas, and API standards.
  - `docs/development/`: Sprint goals, developer onboarding, testing strategies, and guidelines.

### `scripts/`
- **Purpose**: Repository automation, developer utility scripts, environment verification, and CI helpers.
- **Rules**: Kept cross-platform and documented with usage instructions.

### Root Configuration Files
- **`.gitignore`**: Excludes build outputs, local secrets, node modules, and machine-specific files.
- **`.editorconfig`**: Guarantees identical whitespace, indent style (spaces), and line-endings across IDEs and operating systems.
- **`.env.example`**: Defines all required environment variables with safe defaults.
- **`README.md`**: Primary entry point for any developer approaching the repository.
