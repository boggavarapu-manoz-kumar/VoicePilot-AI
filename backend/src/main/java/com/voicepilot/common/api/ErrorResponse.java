package com.voicepilot.common.api;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.List;

/**
 * Standard error response envelope inspired by RFC 7807 problem details.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        boolean success,
        ErrorDetails error,
        Instant timestamp
) {
    public static ErrorResponse of(String code, String message, List<ValidationErrorItem> details) {
        return new ErrorResponse(false, new ErrorDetails(code, message, details), Instant.now());
    }

    public static ErrorResponse of(String code, String message) {
        return of(code, message, null);
    }

    public record ErrorDetails(
            String code,
            String message,
            List<ValidationErrorItem> details
    ) {}

    public record ValidationErrorItem(
            String field,
            String issue
    ) {}
}
