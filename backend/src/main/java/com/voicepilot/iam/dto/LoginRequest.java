package com.voicepilot.iam.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Email is required")
        @Email(message = "Valid email address is required")
        @Size(max = 160, message = "Email cannot exceed 160 characters")
        String email,

        @NotBlank(message = "Password is required")
        String password
) {}

