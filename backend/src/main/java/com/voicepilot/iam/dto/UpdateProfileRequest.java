package com.voicepilot.iam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Display name is required")
        @Size(min = 2, max = 100, message = "Display name must be between 2 and 100 characters")
        String displayName,

        @Size(max = 500, message = "Avatar URL cannot exceed 500 characters")
        String avatarUrl
) {}

