package com.voicepilot.iam.security;

import com.voicepilot.iam.model.WorkspaceRole;
import java.io.Serializable;
import java.security.Principal;
import java.util.Objects;

/**
 * Authenticated principal representation stored in Spring Security's SecurityContext.
 */
public record WorkspacePrincipal(
        Long userId,
        String email,
        Long workspaceId,
        WorkspaceRole role,
        String jti
) implements Principal, Serializable {

    @Override
    public String getName() {
        return email;
    }

    public WorkspacePrincipal {
        Objects.requireNonNull(userId, "userId must not be null");
        Objects.requireNonNull(email, "email must not be null");
        Objects.requireNonNull(workspaceId, "workspaceId must not be null");
        Objects.requireNonNull(role, "role must not be null");
    }
}

