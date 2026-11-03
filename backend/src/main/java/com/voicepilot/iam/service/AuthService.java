package com.voicepilot.iam.service;

import com.voicepilot.common.exception.ResourceConflictException;
import com.voicepilot.common.exception.ResourceNotFoundException;
import com.voicepilot.iam.dto.AuthResponse;
import com.voicepilot.iam.dto.LoginRequest;
import com.voicepilot.iam.dto.RegisterRequest;
import com.voicepilot.iam.dto.UserProfileResponse;
import com.voicepilot.iam.dto.UserProfileResponse.UserWorkspaceMembershipDto;
import com.voicepilot.iam.model.LoginAttempt;
import com.voicepilot.iam.model.RefreshToken;
import com.voicepilot.iam.model.TokenBlocklistEntry;
import com.voicepilot.iam.model.User;
import com.voicepilot.iam.model.Workspace;
import com.voicepilot.iam.model.WorkspaceMember;
import com.voicepilot.iam.model.WorkspaceRole;
import com.voicepilot.iam.repository.LoginAttemptRepository;
import com.voicepilot.iam.repository.RefreshTokenRepository;
import com.voicepilot.iam.repository.TokenBlocklistRepository;
import com.voicepilot.iam.repository.UserRepository;
import com.voicepilot.iam.repository.WorkspaceMemberRepository;
import com.voicepilot.iam.repository.WorkspaceRepository;
import com.voicepilot.iam.security.JwtService;
import com.voicepilot.iam.security.WorkspacePrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/**
 * Service managing registration, login, token rotation, and logout.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final TokenBlocklistRepository tokenBlocklistRepository;
    private final LoginAttemptRepository loginAttemptRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
                       WorkspaceRepository workspaceRepository,
                       WorkspaceMemberRepository workspaceMemberRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       TokenBlocklistRepository tokenBlocklistRepository,
                       LoginAttemptRepository loginAttemptRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.tokenBlocklistRepository = tokenBlocklistRepository;
        this.loginAttemptRepository = loginAttemptRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Registers a new user and generates an initial workspace where the user is WORKSPACE_ADMIN.
     */
    @Transactional
    public RegistrationResult register(RegisterRequest request) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new ResourceConflictException("User with email '" + normalizedEmail + "' already exists");
        }

        // 1. Create and persist user
        User user = new User(
                normalizedEmail,
                passwordEncoder.encode(request.password()),
                request.displayName().trim()
        );
        user = userRepository.save(user);

        // 2. Generate workspace
        String wsName = (request.workspaceName() != null && !request.workspaceName().isBlank())
                ? request.workspaceName().trim()
                : user.getDisplayName() + "'s Workspace";

        String baseSlug = generateSlug(wsName);
        String finalSlug = baseSlug;
        int count = 1;
        while (workspaceRepository.existsBySlug(finalSlug)) {
            finalSlug = baseSlug + "-" + count++;
        }

        Workspace workspace = new Workspace(wsName, finalSlug, "FREE");
        workspace = workspaceRepository.save(workspace);

        // 3. Link user as WORKSPACE_ADMIN
        WorkspaceMember member = new WorkspaceMember(workspace, user, WorkspaceRole.WORKSPACE_ADMIN);
        workspaceMemberRepository.save(member);

        // 4. Issue initial tokens
        String familyId = UUID.randomUUID().toString();
        String rawRefreshToken = generateSecureOpaqueToken();
        String tokenHash = JwtService.hashToken(rawRefreshToken);
        Instant refreshExpiry = Instant.now().plusSeconds(jwtService.getProperties().getRefreshTokenTtlSeconds());

        RefreshToken refreshToken = new RefreshToken(user.getId(), workspace.getId(), tokenHash, familyId, refreshExpiry);
        refreshTokenRepository.save(refreshToken);

        String jti = UUID.randomUUID().toString();
        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                workspace.getId(),
                WorkspaceRole.WORKSPACE_ADMIN,
                jti
        );

        UserProfileResponse profile = buildUserProfile(user);
        AuthResponse authResponse = AuthResponse.of(
                accessToken,
                jwtService.getProperties().getAccessTokenTtlSeconds(),
                profile,
                new AuthResponse.WorkspaceInfo(workspace.getId(), workspace.getName(), workspace.getSlug(), WorkspaceRole.WORKSPACE_ADMIN)
        );

        return new RegistrationResult(authResponse, rawRefreshToken);
    }

    /**
     * Authenticates a user by email and password, returning tokens and profile.
     */
    @Transactional
    public LoginResult login(LoginRequest request, String ipAddress) {
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);

        // Protect against brute force: check failed attempts in past 10 minutes
        Instant tenMinutesAgo = Instant.now().minusSeconds(600);
        long recentFailures = loginAttemptRepository.countFailedAttemptsByEmailSince(normalizedEmail, tenMinutesAgo);
        if (recentFailures >= 5) {
            log.warn("Account {} is temporarily locked due to {} consecutive failed attempts", normalizedEmail, recentFailures);
            throw new BadCredentialsException("Account temporarily locked due to multiple failed login attempts. Try again later.");
        }

        User user = userRepository.findByEmail(normalizedEmail)
                .orElse(null);

        if (user == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            loginAttemptRepository.save(new LoginAttempt(normalizedEmail, ipAddress, false));
            throw new BadCredentialsException("Invalid email or password");
        }

        if (!user.isActive()) {
            loginAttemptRepository.save(new LoginAttempt(normalizedEmail, ipAddress, false));
            throw new DisabledException("Account has been disabled. Please contact support.");
        }

        loginAttemptRepository.save(new LoginAttempt(normalizedEmail, ipAddress, true));

        // Locate user's active workspace memberships
        List<WorkspaceMember> memberships = workspaceMemberRepository.findAllByUserIdWithWorkspace(user.getId());
        if (memberships.isEmpty()) {
            throw new IllegalStateException("User does not belong to any active workspace");
        }

        WorkspaceMember defaultMembership = memberships.get(0);
        Workspace workspace = defaultMembership.getWorkspace();
        WorkspaceRole role = defaultMembership.getRole();

        // Generate tokens
        String familyId = UUID.randomUUID().toString();
        String rawRefreshToken = generateSecureOpaqueToken();
        String tokenHash = JwtService.hashToken(rawRefreshToken);
        Instant refreshExpiry = Instant.now().plusSeconds(jwtService.getProperties().getRefreshTokenTtlSeconds());

        RefreshToken refreshToken = new RefreshToken(user.getId(), workspace.getId(), tokenHash, familyId, refreshExpiry);
        refreshTokenRepository.save(refreshToken);

        String jti = UUID.randomUUID().toString();
        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                workspace.getId(),
                role,
                jti
        );

        UserProfileResponse profile = buildUserProfile(user, memberships);
        AuthResponse authResponse = AuthResponse.of(
                accessToken,
                jwtService.getProperties().getAccessTokenTtlSeconds(),
                profile,
                new AuthResponse.WorkspaceInfo(workspace.getId(), workspace.getName(), workspace.getSlug(), role)
        );

        return new LoginResult(authResponse, rawRefreshToken);
    }

    /**
     * Refreshes the access token using an incoming refresh token with rotation and reuse detection.
     */
    @Transactional
    public RefreshResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new BadCredentialsException("Refresh token is missing");
        }

        String tokenHash = JwtService.hashToken(rawRefreshToken);
        RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Invalid or unrecognized refresh token"));

        // Reuse detection check: If token is revoked, invalidate entire token family
        if (token.isRevoked()) {
            log.warn("DETECTED REUSE OF REVOKED REFRESH TOKEN for familyId: {}. Revoking all tokens in family.", token.getFamilyId());
            refreshTokenRepository.revokeAllByFamilyId(token.getFamilyId());
            throw new BadCredentialsException("Refresh token compromise detected; all active sessions revoked");
        }

        // Expiry check
        if (token.getExpiresAt().isBefore(Instant.now())) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            throw new BadCredentialsException("Refresh token has expired");
        }

        // User and Workspace validation
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> new BadCredentialsException("User not found"));
        if (!user.isActive()) {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            throw new DisabledException("User account is inactive");
        }

        WorkspaceMember member = workspaceMemberRepository
                .findByUserIdAndWorkspaceId(user.getId(), token.getWorkspaceId())
                .orElseThrow(() -> new BadCredentialsException("User is no longer a member of the workspace"));

        // Revoke the current token (Rotation step)
        token.setRevoked(true);
        token.setLastUsedAt(Instant.now());
        refreshTokenRepository.save(token);

        // Issue new rotated refresh token in the same family
        String newRawRefreshToken = generateSecureOpaqueToken();
        String newTokenHash = JwtService.hashToken(newRawRefreshToken);
        Instant refreshExpiry = Instant.now().plusSeconds(jwtService.getProperties().getRefreshTokenTtlSeconds());

        RefreshToken newRefreshToken = new RefreshToken(
                user.getId(),
                token.getWorkspaceId(),
                newTokenHash,
                token.getFamilyId(),
                refreshExpiry
        );
        refreshTokenRepository.save(newRefreshToken);

        // Issue new access token
        String jti = UUID.randomUUID().toString();
        String newAccessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                token.getWorkspaceId(),
                member.getRole(),
                jti
        );

        List<WorkspaceMember> memberships = workspaceMemberRepository.findAllByUserIdWithWorkspace(user.getId());
        UserProfileResponse profile = buildUserProfile(user, memberships);

        AuthResponse authResponse = AuthResponse.of(
                newAccessToken,
                jwtService.getProperties().getAccessTokenTtlSeconds(),
                profile,
                new AuthResponse.WorkspaceInfo(
                        member.getWorkspace().getId(),
                        member.getWorkspace().getName(),
                        member.getWorkspace().getSlug(),
                        member.getRole()
                )
        );

        return new RefreshResult(authResponse, newRawRefreshToken);
    }

    /**
     * Revokes the active refresh token and blocklists the active access token JTI.
     */
    @Transactional
    public void logout(String rawRefreshToken, WorkspacePrincipal principal) {
        if (rawRefreshToken != null && !rawRefreshToken.isBlank()) {
            String tokenHash = JwtService.hashToken(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
        }

        if (principal != null && principal.jti() != null) {
            Instant expiresAt = Instant.now().plusSeconds(jwtService.getProperties().getAccessTokenTtlSeconds());
            tokenBlocklistRepository.save(new TokenBlocklistEntry(principal.jti(), expiresAt));
        }
    }

    /**
     * Retrieves current user profile with active workspace memberships.
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        List<WorkspaceMember> memberships = workspaceMemberRepository.findAllByUserIdWithWorkspace(userId);
        return buildUserProfile(user, memberships);
    }

    private UserProfileResponse buildUserProfile(User user) {
        List<WorkspaceMember> memberships = workspaceMemberRepository.findAllByUserIdWithWorkspace(user.getId());
        return buildUserProfile(user, memberships);
    }

    private UserProfileResponse buildUserProfile(User user, List<WorkspaceMember> memberships) {
        List<UserWorkspaceMembershipDto> wsDtos = memberships.stream()
                .map(m -> new UserWorkspaceMembershipDto(
                        m.getWorkspace().getId(),
                        m.getWorkspace().getName(),
                        m.getWorkspace().getSlug(),
                        m.getRole()
                ))
                .toList();

        return UserProfileResponse.from(user, wsDtos);
    }

    private String generateSlug(String name) {
        String slug = name.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
        if (slug.isBlank()) {
            slug = "workspace";
        }
        if (slug.length() > 60) {
            slug = slug.substring(0, 60);
        }
        return slug;
    }

    private String generateSecureOpaqueToken() {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public record RegistrationResult(AuthResponse authResponse, String rawRefreshToken) {}
    public record LoginResult(AuthResponse authResponse, String rawRefreshToken) {}
    public record RefreshResult(AuthResponse authResponse, String rawRefreshToken) {}
}

