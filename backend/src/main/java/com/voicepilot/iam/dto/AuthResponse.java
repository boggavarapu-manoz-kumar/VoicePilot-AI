package com.voicepilot.iam.dto;

import com.voicepilot.iam.model.WorkspaceRole;

public record AuthResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UserProfileResponse user,
        WorkspaceInfo activeWorkspace
) {
    public static AuthResponse of(String accessToken, long expiresIn, UserProfileResponse user, WorkspaceInfo activeWorkspace) {
        return new AuthResponse(accessToken, "Bearer", expiresIn, user, activeWorkspace);
    }

    public record WorkspaceInfo(
            Long id,
            String name,
            String slug,
            WorkspaceRole role
    ) {}
}

