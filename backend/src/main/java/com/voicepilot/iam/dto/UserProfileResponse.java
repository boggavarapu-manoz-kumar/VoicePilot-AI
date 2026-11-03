package com.voicepilot.iam.dto;

import com.voicepilot.iam.model.User;
import com.voicepilot.iam.model.WorkspaceRole;

import java.time.Instant;
import java.util.List;

public record UserProfileResponse(
        Long id,
        String email,
        String displayName,
        String avatarUrl,
        boolean active,
        Instant emailVerifiedAt,
        Instant createdAt,
        List<UserWorkspaceMembershipDto> workspaces
) {
    public static UserProfileResponse from(User user, List<UserWorkspaceMembershipDto> workspaces) {
        return new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getAvatarUrl(),
                user.isActive(),
                user.getEmailVerifiedAt(),
                user.getCreatedAt(),
                workspaces
        );
    }

    public record UserWorkspaceMembershipDto(
            Long workspaceId,
            String workspaceName,
            String workspaceSlug,
            WorkspaceRole role
    ) {}
}

