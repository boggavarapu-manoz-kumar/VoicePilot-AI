package com.voicepilot.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class WebCorsConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("CORS preflight allows authorized frontend origin (http://localhost:5173)")
    void corsAllowsAuthorizedOrigin() throws Exception {
        mockMvc.perform(options("/health")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    @DisplayName("CORS preflight rejects unauthorized arbitrary origin (http://malicious-origin.com)")
    void corsRejectsUnauthorizedOrigin() throws Exception {
        mockMvc.perform(options("/health")
                        .header("Origin", "http://malicious-origin.com")
                        .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isForbidden());
    }
}
