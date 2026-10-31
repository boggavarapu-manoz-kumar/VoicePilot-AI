package com.voicepilot.contacts.dto;

import com.voicepilot.contacts.model.ContactStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Payload for updating an existing CRM Contact.
 */
public record UpdateContactRequest(
        @NotBlank(message = "First name is required")
        @Size(max = 80, message = "First name must not exceed 80 characters")
        String firstName,

        @NotBlank(message = "Last name is required")
        @Size(max = 80, message = "Last name must not exceed 80 characters")
        String lastName,

        @NotBlank(message = "Email is required")
        @Email(message = "Email must be valid")
        @Size(max = 160, message = "Email must not exceed 160 characters")
        String email,

        @Size(max = 32, message = "Phone must not exceed 32 characters")
        String phone,

        @Size(max = 100, message = "Job title must not exceed 100 characters")
        String jobTitle,

        @NotNull(message = "Status is required")
        ContactStatus status,

        String notes,

        Long accountId
) {
}

