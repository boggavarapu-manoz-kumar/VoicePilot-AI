package com.voicepilot.contacts.dto;

import com.voicepilot.contacts.model.AccountStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload for updating an existing CRM Account.
 */
public record UpdateAccountRequest(
        @NotBlank(message = "Account name is required")
        @Size(max = 160, message = "Account name must not exceed 160 characters")
        String name,

        @Size(max = 128, message = "Domain must not exceed 128 characters")
        String domain,

        @Size(max = 80, message = "Industry must not exceed 80 characters")
        String industry,

        @Size(max = 32, message = "Phone must not exceed 32 characters")
        String phone,

        @Size(max = 255, message = "Website must not exceed 255 characters")
        String website,

        @NotNull(message = "Account status is required")
        AccountStatus status
) {
}

