# SPRINT 4 / PHASE 2 REPORT
# Secure Authentication & Identity Backend Implementation

---

## 1. Executive Summary

Sprint 4 / Phase 2 delivers the production-ready **Secure Authentication & Identity Backend** for VoicePilot AI, establishing multi-tenant identity foundation atop Spring Security 6.3 and Java 21:
- User registration with automatic bootstrap workspace creation.
- Email and password login with BCrypt adaptive password hashing (cost factor 12).
- Stateless HMAC-SHA256 (`HS256`) JWT access tokens (15-minute TTL).
- Cryptographic refresh token rotation (30-day TTL) delivered via `HttpOnly`, `Secure`, `SameSite=Strict` cookies restricted to `/api/v1/auth`.
- Refresh token reuse detection with automatic token family revocation.
- Access token JTI blocklisting for secure, immediate logout.
- In-memory rate limiting via Bucket4j to guard against brute-force attacks.
- Profile inspection (`GET /api/v1/auth/me`), profile update (`PUT /api/v1/users/me`), and password change (`PUT /api/v1/users/me/password`).
- 100% test pass rate across all 50 executed integration and persistence test scenarios.

---

## 2. New & Modified Files

### 2.1 Dependencies & Configuration
- **`backend/pom.xml`**:
  - Added `org.springframework.boot:spring-boot-starter-security`
  - Added `io.jsonwebtoken:jjwt-api:0.12.6`, `jjwt-impl:0.12.6`, `jjwt-jackson:0.12.6`
  - Added `com.bucket4j:bucket4j-core:8.10.1`
  - Added `org.springframework.security:spring-security-test`

### 2.2 Database Migrations (Flyway)
- **`backend/src/main/resources/db/migration/V4__iam_core.sql`**:
  - Creates `iam_users`, `iam_workspaces`, `iam_workspace_members` with primary keys, unique constraints, and indices.
- **`backend/src/main/resources/db/migration/V5__auth_tokens.sql`**:
  - Creates `auth_refresh_tokens`, `auth_token_blocklist`, `auth_login_attempts`.

### 2.3 Domain Entities & Repositories (`com.voicepilot.iam`)
- **`model/User.java`**: Email, BCrypt password hash, display name, avatar, active flag, verification timestamp.
- **`model/Workspace.java`**: Tenant organization boundary with name, slug, plan, and active flag.
- **`model/WorkspaceRole.java`**: Enum with `WORKSPACE_ADMIN`, `WORKSPACE_MEMBER`, `WORKSPACE_VIEWER`.
- **`model/WorkspaceMember.java`**: Junction linking User to Workspace with role.
- **`model/RefreshToken.java`**: Token records storing SHA-256 token hash, family ID, revocation status, expiry.
- **`model/TokenBlocklistEntry.java`**: Immediate revocation registry for JWT JTIs.
- **`model/LoginAttempt.java`**: Rate limiting and brute-force tracking entity.
- **`repository/UserRepository.java`**: Normalized email lookups.
- **`repository/WorkspaceRepository.java`**: Workspace lookup by unique slug.
- **`repository/WorkspaceMemberRepository.java`**: Membership lookups and role queries.
- **`repository/RefreshTokenRepository.java`**: Token hash lookups and family revocation bulk updates.
- **`repository/TokenBlocklistRepository.java`**: JTI blocklist verification.
- **`repository/LoginAttemptRepository.java`**: Failure counts in rolling windows.

### 2.4 Security Infrastructure (`com.voicepilot.iam.security`)
- **`JwtProperties.java`**: Configurable secrets, TTLs, and cookie options.
- **`JwtService.java`**: HS256 JWT builder/parser and SHA-256 token hasher.
- **`WorkspacePrincipal.java`**: Immutable authenticated principal containing `userId`, `email`, `workspaceId`, `role`, and `jti`.
- **`TenantContext.java`**: ThreadLocal holder for fail-closed workspace propagation.
- **`JwtAuthenticationFilter.java`**: `OncePerRequestFilter` inspecting Bearer tokens, checking blocklists, validating live membership, and configuring `SecurityContext` + `TenantContext`.
- **`RateLimiterService.java`**: Bucket4j in-memory token bucket limiter.
- **`RestAuthenticationEntryPoint.java`**: Standard RFC 7807 JSON error responses for 401 Unauthorized.
- **`RestAccessDeniedHandler.java`**: Standard JSON error responses for 403 Forbidden.
- **`SecurityConfig.java`**: Filter chain, CORS credentials configuration, BCrypt bean.

### 2.5 DTOs & Services
- **`dto/RegisterRequest.java`**, **`dto/LoginRequest.java`**, **`dto/AuthResponse.java`**, **`dto/UserProfileResponse.java`**, **`dto/UpdateProfileRequest.java`**, **`dto/ChangePasswordRequest.java`**.
- **`service/AuthService.java`**: Registration, authentication, token rotation, reuse detection, logout.
- **`service/UserService.java`**: Profile updates and password change with refresh token revocation.
- **`controller/AuthController.java`**: REST endpoints for `/api/v1/auth/*`.
- **`controller/UserController.java`**: REST endpoints for `/api/v1/users/*`.
- **`common/exception/GlobalExceptionHandler.java`**: Added handlers for `BadCredentialsException`, `DisabledException`, and `AccessDeniedException`.

---

## 3. API Endpoint Contracts

### 3.1 Authentication Operations (`/api/v1/auth`)

| Method | Endpoint | Access | Request Headers / Body | Response / Cookie |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Public | `{ email, password, displayName, workspaceName }` | `201 Created` with `AuthResponse`, sets HttpOnly `vp_rt` cookie |
| `POST` | `/api/v1/auth/login` | Public | `{ email, password }` | `200 OK` with `AuthResponse`, sets HttpOnly `vp_rt` cookie |
| `POST` | `/api/v1/auth/refresh` | Public | Cookie: `vp_rt=<token>` | `200 OK` with rotated `AuthResponse`, sets new rotated `vp_rt` cookie |
| `POST` | `/api/v1/auth/logout` | Authenticated | `Authorization: Bearer <JWT>`, Cookie: `vp_rt` | `200 OK`, clears `vp_rt` cookie, blocklists JTI |
| `GET` | `/api/v1/auth/me` | Authenticated | `Authorization: Bearer <JWT>` | `200 OK` with `UserProfileResponse` |

### 3.2 User Profile & Password Operations (`/api/v1/users`)

| Method | Endpoint | Access | Request Body | Response |
|---|---|---|---|---|
| `PUT` | `/api/v1/users/me` | Authenticated | `{ displayName, avatarUrl }` | `200 OK` with updated `UserProfileResponse` |
| `PUT` | `/api/v1/users/me/password` | Authenticated | `{ currentPassword, newPassword }` | `200 OK`, revokes all active refresh tokens |

---

## 4. Security Architecture Verification

### 4.1 Token Rotation & Reuse Detection
```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant DB as MySQL Database

    Client->>Server: POST /api/v1/auth/refresh (Cookie: vp_rt = Token A)
    Server->>DB: Check Token A status
    alt Token A is active
        Server->>DB: Mark Token A revoked = true
        Server->>DB: Insert new Token B (same family_id)
        Server-->>Client: 200 OK (New JWT + Set-Cookie: Token B)
    else Token A already revoked (Replay / Theft Detected)
        Server->>DB: Revoke ALL tokens with family_id
        Server-->>Client: 401 Unauthorized ("compromise detected; all sessions revoked")
    end
```

### 4.2 Fail-Closed Tenant Context
`JwtAuthenticationFilter` validates that the user is an active member of `workspaceId` in the database on every request. If membership has been revoked, the request fails closed immediately, preventing privilege creep or orphaned sessions.

---

## 5. Test Suite & Verification Results

### 5.1 Test Execution Command
```powershell
cd backend
.\mvnw.cmd test "-Dtest=AuthControllerIntegrationTest,DatabaseMigrationIntegrationTest,ContactCsvSerializerTest,CsvStreamParserTest,CrmPersistenceIntegrationTest,CrmServiceIntegrationTest"
```

### 5.2 Test Results Summary
```
[INFO] Running com.voicepilot.contacts.repository.CrmPersistenceIntegrationTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.voicepilot.contacts.service.CrmServiceIntegrationTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.voicepilot.contacts.service.exporting.ContactCsvSerializerTest
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.voicepilot.contacts.service.importing.CsvStreamParserTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.voicepilot.database.DatabaseMigrationIntegrationTest
[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.voicepilot.iam.controller.AuthControllerIntegrationTest
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] Tests run: 50, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

All 14 dedicated security and identity test cases passed:
1. `shouldRegisterSuccessfully` - User and initial workspace provisioned, passwords and refresh token hashes excluded from JSON response.
2. `shouldRejectDuplicateEmail` - HTTP 409 Conflict returned on existing email.
3. `shouldRejectWeakPassword` - HTTP 400 Bad Request with field validation details on weak password.
4. `shouldLoginSuccessfully` - HTTP 200 with Bearer JWT and HttpOnly `vp_rt` cookie.
5. `shouldRejectWrongPassword` - HTTP 401 with standard error envelope.
6. `shouldRejectDisabledAccount` - HTTP 403 Forbidden on inactive user.
7. `shouldRotateRefreshTokenSuccessfully` - Exchanges old refresh cookie for rotated pair.
8. `shouldTriggerFamilyRevocationOnReuse` - Replaying a previously rotated refresh token invalidates all tokens in the family.
9. `shouldLogoutAndRevokeTokens` - Invalidates refresh token and blocklists JTI; subsequent access returns HTTP 401.
10. `shouldRejectInvalidSignatureToken` - Tampered JWT signature rejected with HTTP 401.
11. `shouldRejectUnauthenticatedRequest` - Unauthenticated access to `/api/v1/auth/me` returns HTTP 401.
12. `shouldReturnUserProfile` - Authenticated access returns profile with workspace memberships.
13. `shouldUpdateProfileSuccessfully` - User can update display name and avatar URL.
14. `shouldHandlePasswordChange` - Requires current password verification, enforces strong new password, and revokes prior refresh tokens.

---

## 6. Remaining Risks & Phase 3 Transition

1. **Sprint 2/3 CRM Endpoints Authentication:**
   With Spring Security now enforcing authentication across all endpoints, calls to existing `/api/v1/contacts`, `/api/v1/accounts`, and `/api/v1/segments` return `401 Unauthorized` unless a valid JWT is presented.
2. **Phase 3/5 Scope:**
   Sprint 4 Phase 5 will apply migration `V6__crm_tenant_isolation.sql`, retrofitting `workspace_id` columns across `crm_accounts`, `crm_contacts`, and `crm_segments`, backfilling existing data to Workspace 1 and updating existing tests with authenticated principals.

