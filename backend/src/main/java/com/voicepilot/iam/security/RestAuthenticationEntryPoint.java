package com.voicepilot.iam.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voicepilot.common.api.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Custom entry point returning standard RFC 7807-style JSON error envelope for 401 Unauthorized.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException)
            throws IOException {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ErrorResponse errorResponse = ErrorResponse.of(
                "UNAUTHORIZED",
                authException.getMessage() != null ? authException.getMessage() : "Full authentication is required to access this resource"
        );
        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
}

