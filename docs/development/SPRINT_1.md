# Sprint 1: Project Genesis & Foundations

## 1. Sprint Goal
Establish a clean, production-oriented repository foundation, architecture documentation, environment planning, and verified project skeletons for VoicePilot AI without implementing premature domain features.

---

## 2. Sprint Scope

### In Scope
- Repository structure establishment (`frontend`, `backend`, `infrastructure`, `docs`, `scripts`).
- Version control hygiene: `.gitignore` and `.editorconfig`.
- Architecture and project structure documentation.
- Environment template (`.env.example`) and local database compose setup (`infrastructure/database/docker-compose.yml`).
- Initial backend skeleton (Spring Boot 3, Java 21, Maven configuration).
- Initial frontend skeleton (React, TypeScript, Vite) with verified clean compilation.
- Baseline verification and documentation of tooling availability.

### Out of Scope (Reserved for Future Sprints)
- Specific CRM entity models (Leads, Contacts, Accounts) - *Sprint 2*.
- Database migration DDL execution against running MySQL instance - *Sprint 2*.
- Telephony provider integration (Twilio / WebRTC) - *Sprint 4*.
- AI model inference or local LLM pipelines - *Sprint 5*.

---

## 3. Sprint 1 Tasks

| Task ID | Description | Status |
| :--- | :--- | :--- |
| **S1-01** | Audit existing workspace and verify developer toolchains | Completed |
| **S1-02** | Initialize repository layout and Git tracking | Completed |
| **S1-03** | Configure `.gitignore` for Java, Node, IDEs, and secrets | Completed |
| **S1-04** | Configure `.editorconfig` for consistent formatting | Completed |
| **S1-05** | Write system architecture specification (`docs/architecture/ARCHITECTURE.md`) | Completed |
| **S1-06** | Write directory responsibility guide (`docs/architecture/PROJECT_STRUCTURE.md`) | Completed |
| **S1-07** | Define local infrastructure specification (`infrastructure/database/docker-compose.yml`) | Completed |
| **S1-08** | Create root `README.md` and `.env.example` | Completed |
| **S1-09** | Scaffold Spring Boot 3 + Java 21 backend modular monolith skeleton | Completed |
| **S1-10** | Scaffold React + TypeScript + Vite frontend skeleton and verify build | Completed |

---

## 4. Acceptance Criteria

- [x] Repository tree matches required structure (`frontend/`, `backend/`, `infrastructure/database/`, `docs/`, `scripts/`).
- [x] Secrets, generated dependencies (`node_modules/`, `target/`), and local database volumes are prevented from commit.
- [x] Frontend compiles cleanly via `npm run build` without TypeScript errors.
- [x] Architecture document precisely details React, Spring Boot modular monolith, MySQL 8, REST API, and AI/voice separation.
- [x] No premature application feature code or unverified service claims are present.
