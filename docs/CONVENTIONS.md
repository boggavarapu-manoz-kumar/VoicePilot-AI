# VoicePilot AI - Development & Engineering Conventions

## 1. Code Standards & Naming Conventions

### Backend (Java 21 / Spring Boot)
- **Package Style**: `com.voicepilot.modules.<module>.<layer>` (e.g., `controller`, `service`, `repository`, `model`, `dto`).
- **Entity Names**: Singular PascalCase (e.g., `Contact`, `Campaign`, `CallLog`).
- **Data Transfer Objects (DTOs)**: Java `record` types preferred for immutability and concise semantics (e.g., `CreateLeadRequest`, `ContactResponse`).
- **Validation**: Strict use of `jakarta.validation` annotations (`@NotBlank`, `@Size`, `@Email`) on all incoming request payloads.
- **Dependency Injection**: Use constructor injection exclusively (no field injection via `@Autowired`).

### Frontend (React / TypeScript / Vite)
- **Component File Names**: PascalCase (e.g., `ContactCard.tsx`, `CampaignList.tsx`).
- **State & Hooks**: Custom hooks prefixed with `use` (e.g., `useContacts.ts`).
- **TypeScript**: Strict mode enabled. No usage of `any`. Explicit interfaces/types for all API payloads and component props.
- **Styling**: Clean, scoped CSS with modern design tokens (CSS variables for theming, dark/light palette, consistent spacing system).

---

## 2. API Design & REST Guidelines

### Response Contracts
All API endpoints return JSON conforming to predictable envelopes:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-10-17T12:00:00Z"
}
```

**Error Response (RFC 7807 inspired):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed for one or more fields",
    "details": [
      { "field": "email", "issue": "Must be a well-formed email address" }
    ]
  },
  "timestamp": "2026-10-17T12:00:00Z"
}
```

### HTTP Status Code Discipline
- `200 OK`: Successful read or update.
- `201 Created`: Resource successfully created (with `Location` header where appropriate).
- `204 No Content`: Successful deletion.
- `400 Bad Request`: Validation failure or malformed payload.
- `404 Not Found`: Entity not found.
- `409 Conflict`: Business rule violation (e.g., duplicate email address).
- `500 Internal Server Error`: Unhandled application error.

---

## 3. Database Migrations (Flyway)

- Migration files reside in `backend/src/main/resources/db/migration/`.
- Naming convention: `V<Version>__<Description>.sql` (e.g., `V1__init_crm_schema.sql`).
- All scripts must be repeatable and forward-only. Never modify an existing, committed migration script.

---

## 4. Git & Commit Conventions

Commit messages follow the Conventional Commits specification:
- `feat(<module>): ...` - New features
- `fix(<module>): ...` - Bug fixes
- `docs: ...` - Documentation updates
- `chore: ...` - Build, configuration, dependencies
- `refactor(<module>): ...` - Code structure improvement with no behavior change
- `test: ...` - Unit, integration, or end-to-end tests
