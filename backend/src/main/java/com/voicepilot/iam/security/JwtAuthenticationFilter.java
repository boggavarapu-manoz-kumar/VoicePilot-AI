package com.voicepilot.iam.security;

import com.voicepilot.iam.model.WorkspaceRole;
import com.voicepilot.iam.repository.TokenBlocklistRepository;
import com.voicepilot.iam.repository.WorkspaceMemberRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Filter that inspects incoming Authorization headers for Bearer JWTs,
 * validates cryptographic integrity and expiry, checks blocklist revocation,
 * verifies active workspace membership, and populates SecurityContext + TenantContext.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final TokenBlocklistRepository tokenBlocklistRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   TokenBlocklistRepository tokenBlocklistRepository,
                                   WorkspaceMemberRepository workspaceMemberRepository) {
        this.jwtService = jwtService;
        this.tokenBlocklistRepository = tokenBlocklistRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = extractBearerToken(request);

        if (token != null) {
            try {
                Claims claims = jwtService.parseAndValidateClaims(token);
                String jti = claims.getId();

                // Check blocklist revocation
                if (jti != null && tokenBlocklistRepository.existsByJti(jti)) {
                    log.warn("Rejected revoked JWT access token with JTI: {}", jti);
                    SecurityContextHolder.clearContext();
                } else {
                    Long userId = Long.valueOf(claims.getSubject());
                    String email = claims.get("email", String.class);
                    Number wsIdNum = claims.get("workspaceId", Number.class);
                    Long workspaceId = wsIdNum != null ? wsIdNum.longValue() : null;
                    String roleStr = claims.get("role", String.class);
                    WorkspaceRole role = roleStr != null ? WorkspaceRole.valueOf(roleStr) : WorkspaceRole.WORKSPACE_VIEWER;

                    if (workspaceId != null) {
                        // Live membership verification against database
                        boolean isMember = workspaceMemberRepository
                                .findByUserIdAndWorkspaceId(userId, workspaceId)
                                .isPresent();

                        if (isMember) {
                            WorkspacePrincipal principal = new WorkspacePrincipal(userId, email, workspaceId, role, jti);
                            List<SimpleGrantedAuthority> authorities = List.of(
                                    new SimpleGrantedAuthority("ROLE_" + role.name())
                            );

                            UsernamePasswordAuthenticationToken authentication =
                                    new UsernamePasswordAuthenticationToken(principal, null, authorities);
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                            TenantContext.set(workspaceId);
                        } else {
                            log.warn("User {} is no longer a member of workspace {}", userId, workspaceId);
                            SecurityContextHolder.clearContext();
                        }
                    }
                }
            } catch (ExpiredJwtException ex) {
                log.debug("JWT token has expired: {}", ex.getMessage());
                SecurityContextHolder.clearContext();
            } catch (JwtException | IllegalArgumentException ex) {
                log.warn("Invalid JWT token encountered: {}", ex.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7).trim();
        }
        return null;
    }
}

