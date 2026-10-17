# VoicePilot AI - Sprint Roadmap

## Sprint 1: Project Genesis & Foundations (Current Sprint)
- [x] Repository audit & environment validation
- [x] Initialized Git repository and `.gitignore`
- [x] Architectural documentation (`ARCHITECTURE.md`, `CONVENTIONS.md`)
- [ ] Local environment specification (`docker-compose.yml`, `.env.example`)
- [ ] Root `README.md` with startup and onboarding instructions
- [ ] Spring Boot 3 + Java 21 backend modular monolith skeleton with Maven wrapper
- [ ] React + TypeScript + Vite frontend skeleton
- [ ] Verify clean builds for both frontend and backend

---

## Sprint 2: Core Domain Foundations & Database Migration (Planned)
- [ ] Flyway database migrations for baseline CRM (Accounts, Contacts, Leads, Activities)
- [ ] JPA entities with auditing (`createdAt`, `updatedAt`, `createdBy`)
- [ ] Global exception handling filter & standard RFC-7807 response envelopes
- [ ] Springdoc OpenAPI interactive documentation integration
- [ ] Base React design system with clean responsive layout and navigation

---

## Sprint 3: CRM Business Workflows & UI (Planned)
- [ ] RESTful CRUD APIs for Contacts, Leads, and Pipeline stages
- [ ] Comprehensive validation and error responses
- [ ] React CRM interface: lead tables, contact detail views, pipeline board
- [ ] Mock telephony event ingestion endpoints

---

## Sprint 4: Voice Campaign Scheduling & Telephony Abstractions (Planned)
- [ ] Campaign data model and cadence scheduler
- [ ] Telephony provider SPI (Twilio/FreeSWITCH abstraction layers)
- [ ] Webhook ingress security & call state machine

---

## Sprint 5: AI Engine Orchestration (Future)
- [ ] Local & remote LLM inference client abstractions (Ollama / OpenAI / Claude)
- [ ] STT / TTS provider adapters
- [ ] RAG pipeline for customer context and knowledge retrieval
