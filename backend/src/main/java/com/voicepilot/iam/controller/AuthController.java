package com.voicepilot.iam.controller;

import com.voicepilot.common.api.ApiResponse;
import com.voicepilot.iam.dto.AuthResponse;
import com.voicepilot.iam.dto.LoginRequest;
import com.voicepilot.iam.dto.RegisterRequest;
import com.voicepilot.iam.dto.UserProfileResponse;
import com.voicepilot.iam.security.JwtProperties;
import com.voicepilot.iam.security.RateLimiterService;
import com.voicepilot.iam.security.WorkspacePrincipal;
import com.voicepilot.iam.service.AuthService;
import com.voicepilot.iam.service.AuthService.LoginResult;
import com.voicepilot.iam.service.AuthService.RefreshResult;
import com.voicepilot.iam.service.AuthService.RegistrationResult;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;

/**
 * Controller handling registration, login, refresh, logout, and current user profile.
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "Authentication & Identity", description = "Registration, login, token refresh, and identity operations")
public class AuthController {

    private final AuthService authService;
    private final RateLimiterService rateLimiterService;
    private final JwtProperties jwtProperties;

    public AuthController(AuthService authService,
                          RateLimiterService rateLimiterService,
                          JwtProperties jwtProperties) {
        this.authService = authService;
        this.rateLimiterService = rateLimiterService;
        this.jwtProperties = jwtProperties;
    }

    @PostMapping("/register")
    @Operation(summary = "Register user and initial workspace", description = "Creates a new user and bootstrap workspace, issuing access and refresh tokens.")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {

        String ipAddress = extractClientIp(servletRequest);
        if (!rateLimiterService.tryConsumeGeneralAuth(ipAddress)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, "60")
                    .build();
        }

        RegistrationResult result = authService.register(request);
        setRefreshTokenCookie(servletResponse, result.rawRefreshToken(), (int) jwtProperties.getRefreshTokenTtlSeconds());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(result.authResponse(), "Registration successful"));
    }

    @PostMapping("/login")
    @Operation(summary = "User login", description = "Authenticates with email and password, setting an HttpOnly refresh cookie and returning access token.")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {

        String ipAddress = extractClientIp(servletRequest);
        if (!rateLimiterService.tryConsumeLogin(ipAddress)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, "60")
                    .build();
        }

        LoginResult result = authService.login(request, ipAddress);
        setRefreshTokenCookie(servletResponse, result.rawRefreshToken(), (int) jwtProperties.getRefreshTokenTtlSeconds());

        return ResponseEntity.ok(ApiResponse.ok(result.authResponse(), "Authentication successful"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate refresh token", description = "Exchanges HttpOnly refresh token cookie for a rotated access and refresh token pair.")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {

        String ipAddress = extractClientIp(servletRequest);
        if (!rateLimiterService.tryConsumeGeneralAuth(ipAddress)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, "60")
                    .build();
        }

        String rawRefreshToken = extractRefreshTokenFromCookie(servletRequest);
        RefreshResult result = authService.refresh(rawRefreshToken);
        setRefreshTokenCookie(servletResponse, result.rawRefreshToken(), (int) jwtProperties.getRefreshTokenTtlSeconds());

        return ResponseEntity.ok(ApiResponse.ok(result.authResponse(), "Token refresh successful"));
    }

    @PostMapping("/logout")
    @Operation(summary = "User logout", description = "Revokes refresh token, adds access token JTI to blocklist, and clears cookie.")
    public ResponseEntity<ApiResponse<Void>> logout(
            @AuthenticationPrincipal WorkspacePrincipal principal,
            HttpServletRequest servletRequest,
            HttpServletResponse servletResponse) {

        String rawRefreshToken = extractRefreshTokenFromCookie(servletRequest);
        authService.logout(rawRefreshToken, principal);
        clearRefreshTokenCookie(servletResponse);

        return ResponseEntity.ok(ApiResponse.ok(null, "Logged out successfully"));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get current authenticated profile", description = "Retrieves profile and workspace memberships of currently logged-in user.")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMe(
            @AuthenticationPrincipal WorkspacePrincipal principal) {

        UserProfileResponse profile = authService.getCurrentUserProfile(principal.userId());
        return ResponseEntity.ok(ApiResponse.ok(profile));
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token, int maxAge) {
        ResponseCookie cookie = ResponseCookie.from(jwtProperties.getRefreshCookieName(), token)
                .httpOnly(true)
                .secure(jwtProperties.isCookieSecure())
                .path("/api/v1/auth")
                .maxAge(maxAge)
                .sameSite("Strict")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(jwtProperties.getRefreshCookieName(), "")
                .httpOnly(true)
                .secure(jwtProperties.isCookieSecure())
                .path("/api/v1/auth")
                .maxAge(0)
                .sameSite("Strict")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        return Arrays.stream(request.getCookies())
                .filter(c -> jwtProperties.getRefreshCookieName().equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}

