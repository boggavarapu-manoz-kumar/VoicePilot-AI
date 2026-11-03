package com.voicepilot.iam.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voicepilot.iam.dto.ChangePasswordRequest;
import com.voicepilot.iam.dto.LoginRequest;
import com.voicepilot.iam.dto.RegisterRequest;
import com.voicepilot.iam.dto.UpdateProfileRequest;
import com.voicepilot.iam.model.User;
import com.voicepilot.iam.model.Workspace;
import com.voicepilot.iam.model.WorkspaceMember;
import com.voicepilot.iam.model.WorkspaceRole;
import com.voicepilot.iam.repository.RefreshTokenRepository;
import com.voicepilot.iam.repository.TokenBlocklistRepository;
import com.voicepilot.iam.repository.UserRepository;
import com.voicepilot.iam.repository.WorkspaceMemberRepository;
import com.voicepilot.iam.repository.WorkspaceRepository;
import com.voicepilot.iam.security.JwtService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WorkspaceRepository workspaceRepository;

    @Autowired
    private WorkspaceMemberRepository workspaceMemberRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private TokenBlocklistRepository tokenBlocklistRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        refreshTokenRepository.deleteAll();
        tokenBlocklistRepository.deleteAll();
        workspaceMemberRepository.deleteAll();
        workspaceRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("User Registration Tests")
    class RegistrationTests {

        @Test
        @DisplayName("POST /api/v1/auth/register - Should register user and bootstrap workspace successfully")
        void shouldRegisterSuccessfully() throws Exception {
            RegisterRequest request = new RegisterRequest(
                    "founder@acme.inc",
                    "SecurePassword123",
                    "Alice Founder",
                    "Acme Global HQ"
            );

            MvcResult result = mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                    .andExpect(jsonPath("$.data.user.email").value("founder@acme.inc"))
                    .andExpect(jsonPath("$.data.user.displayName").value("Alice Founder"))
                    .andExpect(jsonPath("$.data.activeWorkspace.name").value("Acme Global HQ"))
                    .andExpect(jsonPath("$.data.activeWorkspace.role").value("WORKSPACE_ADMIN"))
                    .andExpect(cookie().exists("vp_rt"))
                    .andExpect(cookie().httpOnly("vp_rt", true))
                    .andReturn();

            // Verify password hash and refresh tokens are excluded from json response
            String json = result.getResponse().getContentAsString();
            assertThat(json).doesNotContain("passwordHash");
            assertThat(json).doesNotContain("tokenHash");

            // Verify database state
            User user = userRepository.findByEmail("founder@acme.inc").orElseThrow();
            assertThat(passwordEncoder.matches("SecurePassword123", user.getPasswordHash())).isTrue();
        }

        @Test
        @DisplayName("POST /api/v1/auth/register - Should reject duplicate email with 409 Conflict")
        void shouldRejectDuplicateEmail() throws Exception {
            userRepository.save(new User("existing@acme.inc", passwordEncoder.encode("Secret123"), "Existing User"));

            RegisterRequest request = new RegisterRequest(
                    "existing@acme.inc",
                    "NewPass123",
                    "New Name",
                    "Workspace"
            );

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("CONFLICT"));
        }

        @Test
        @DisplayName("POST /api/v1/auth/register - Should reject weak password with 400 Bad Request")
        void shouldRejectWeakPassword() throws Exception {
            RegisterRequest request = new RegisterRequest(
                    "user@test.local",
                    "weak",
                    "User",
                    "Ws"
            );

            mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"));
        }
    }

    @Nested
    @DisplayName("User Login Tests")
    class LoginTests {

        private User testUser;
        private Workspace testWs;

        @BeforeEach
        void createTestUser() {
            testUser = userRepository.save(new User("test@voicepilot.ai", passwordEncoder.encode("ValidPass123"), "Test User"));
            testWs = workspaceRepository.save(new Workspace("Test Org", "test-org", "PRO"));
            workspaceMemberRepository.save(new WorkspaceMember(testWs, testUser, WorkspaceRole.WORKSPACE_MEMBER));
        }

        @Test
        @DisplayName("POST /api/v1/auth/login - Correct credentials return access token and set HttpOnly refresh cookie")
        void shouldLoginSuccessfully() throws Exception {
            LoginRequest request = new LoginRequest("test@voicepilot.ai", "ValidPass123");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                    .andExpect(jsonPath("$.data.user.email").value("test@voicepilot.ai"))
                    .andExpect(jsonPath("$.data.activeWorkspace.id").value(testWs.getId()))
                    .andExpect(cookie().exists("vp_rt"))
                    .andExpect(cookie().httpOnly("vp_rt", true));
        }

        @Test
        @DisplayName("POST /api/v1/auth/login - Incorrect password returns 401 Unauthorized")
        void shouldRejectWrongPassword() throws Exception {
            LoginRequest request = new LoginRequest("test@voicepilot.ai", "WrongPassword999");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("BAD_CREDENTIALS"));
        }

        @Test
        @DisplayName("POST /api/v1/auth/login - Disabled account returns 403 Forbidden")
        void shouldRejectDisabledAccount() throws Exception {
            testUser.setActive(false);
            userRepository.save(testUser);

            LoginRequest request = new LoginRequest("test@voicepilot.ai", "ValidPass123");

            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.error.code").value("ACCOUNT_DISABLED"));
        }
    }

    @Nested
    @DisplayName("Token Rotation, Revocation & Reuse Tests")
    class TokenLifecycleTests {

        private String rawRefreshToken;
        private String accessToken;

        @BeforeEach
        void registerAndGetTokens() throws Exception {
            RegisterRequest request = new RegisterRequest(
                    "lifecycle@acme.com",
                    "SecureLifecycle123",
                    "Lifecycle User",
                    "Lifecycle WS"
            );

            MvcResult result = mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andReturn();

            Cookie cookie = result.getResponse().getCookie("vp_rt");
            assertThat(cookie).isNotNull();
            rawRefreshToken = cookie.getValue();

            JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
            accessToken = root.path("data").path("accessToken").asText();
        }

        @Test
        @DisplayName("POST /api/v1/auth/refresh - Valid refresh token rotates tokens successfully")
        void shouldRotateRefreshTokenSuccessfully() throws Exception {
            MvcResult result = mockMvc.perform(post("/auth/refresh")
                            .cookie(new Cookie("vp_rt", rawRefreshToken)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").isNotEmpty())
                    .andExpect(cookie().exists("vp_rt"))
                    .andReturn();

            Cookie newCookie = result.getResponse().getCookie("vp_rt");
            assertThat(newCookie).isNotNull();
            assertThat(newCookie.getValue()).isNotEqualTo(rawRefreshToken);
        }

        @Test
        @DisplayName("POST /api/v1/auth/refresh - Refresh token reuse triggers family revocation")
        void shouldTriggerFamilyRevocationOnReuse() throws Exception {
            // First rotation consumes rawRefreshToken
            mockMvc.perform(post("/auth/refresh")
                            .cookie(new Cookie("vp_rt", rawRefreshToken)))
                    .andExpect(status().isOk());

            // Second presentation of the SAME token simulates theft/replay attack
            mockMvc.perform(post("/auth/refresh")
                            .cookie(new Cookie("vp_rt", rawRefreshToken)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error.message").value(containsString("compromise detected")));
        }

        @Test
        @DisplayName("POST /api/v1/auth/logout - Revokes refresh token and blocklists access token JTI")
        void shouldLogoutAndRevokeTokens() throws Exception {
            mockMvc.perform(post("/auth/logout")
                            .header("Authorization", "Bearer " + accessToken)
                            .cookie(new Cookie("vp_rt", rawRefreshToken)))
                    .andExpect(status().isOk())
                    .andExpect(cookie().maxAge("vp_rt", 0));

            // Verify access token is now rejected on protected endpoint
            mockMvc.perform(get("/auth/me")
                            .header("Authorization", "Bearer " + accessToken))
                    .andExpect(status().isUnauthorized());

            // Verify refresh token is also revoked
            mockMvc.perform(post("/auth/refresh")
                            .cookie(new Cookie("vp_rt", rawRefreshToken)))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        @DisplayName("Tampered / Invalid signature JWT is rejected with 401")
        void shouldRejectInvalidSignatureToken() throws Exception {
            String forgedToken = accessToken + "tampered";

            mockMvc.perform(get("/auth/me")
                            .header("Authorization", "Bearer " + forgedToken))
                    .andExpect(status().isUnauthorized());
        }
    }

    @Nested
    @DisplayName("Protected Endpoints, Profile & Password Update Tests")
    class ProfileAndPasswordTests {

        private String accessToken;

        @BeforeEach
        void registerUser() throws Exception {
            RegisterRequest request = new RegisterRequest(
                    "member@voicepilot.ai",
                    "MemberPass123",
                    "Original Name",
                    "Original WS"
            );

            MvcResult result = mockMvc.perform(post("/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andReturn();

            JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
            accessToken = root.path("data").path("accessToken").asText();
        }

        @Test
        @DisplayName("GET /api/v1/auth/me - Access without token returns 401 Unauthorized")
        void shouldRejectUnauthenticatedRequest() throws Exception {
            mockMvc.perform(get("/auth/me"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error.code").value("UNAUTHORIZED"));
        }

        @Test
        @DisplayName("GET /api/v1/auth/me - Access with valid token returns user profile")
        void shouldReturnUserProfile() throws Exception {
            mockMvc.perform(get("/auth/me")
                            .header("Authorization", "Bearer " + accessToken))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.email").value("member@voicepilot.ai"))
                    .andExpect(jsonPath("$.data.displayName").value("Original Name"))
                    .andExpect(jsonPath("$.data.workspaces[0].role").value("WORKSPACE_ADMIN"));
        }

        @Test
        @DisplayName("PUT /api/v1/users/me - Updates user profile successfully")
        void shouldUpdateProfileSuccessfully() throws Exception {
            UpdateProfileRequest request = new UpdateProfileRequest("Updated Name", "https://img.cdn/avatar.png");

            mockMvc.perform(put("/users/me")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.displayName").value("Updated Name"))
                    .andExpect(jsonPath("$.data.avatarUrl").value("https://img.cdn/avatar.png"));
        }

        @Test
        @DisplayName("PUT /api/v1/users/me/password - Valid password change succeeds; wrong current password fails")
        void shouldHandlePasswordChange() throws Exception {
            // 1. Wrong current password fails
            ChangePasswordRequest badRequest = new ChangePasswordRequest("WrongPass123", "BrandNewPass456");
            mockMvc.perform(put("/users/me/password")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(badRequest)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error.code").value("BAD_CREDENTIALS"));

            // 2. Correct current password succeeds
            ChangePasswordRequest goodRequest = new ChangePasswordRequest("MemberPass123", "BrandNewPass456");
            mockMvc.perform(put("/users/me/password")
                            .header("Authorization", "Bearer " + accessToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(goodRequest)))
                    .andExpect(status().isOk());

            // 3. New password works for subsequent login
            LoginRequest loginRequest = new LoginRequest("member@voicepilot.ai", "BrandNewPass456");
            mockMvc.perform(post("/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginRequest)))
                    .andExpect(status().isOk());
        }
    }
}

