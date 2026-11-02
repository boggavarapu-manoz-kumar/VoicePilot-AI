package com.voicepilot.contacts.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request model for updating an existing saved Contact Segment.
 */
public record UpdateSegmentRequest(

        @NotBlank(message = "Segment name must not be blank")
        @Size(max = 120, message = "Segment name must not exceed 120 characters")
        String name,

        @Size(max = 255, message = "Description must not exceed 255 characters")
        String description,

        @NotNull(message = "Filter criteria must not be null")
        @Valid
        SegmentFilterCriteria filterCriteria
) {}

