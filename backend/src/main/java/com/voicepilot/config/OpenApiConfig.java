package com.voicepilot.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI 3 configuration for automated API documentation.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI voicePilotOpenAPI(
            @Value("${spring.application.name:voicepilot-backend}") String appName,
            @Value("${voicepilot.version:0.0.1-SNAPSHOT}") String version
    ) {
        return new OpenAPI()
                .info(new Info()
                        .title("VoicePilot AI - Voice CRM SaaS API")
                        .description("Production-oriented REST API for Voice CRM, campaigns, and AI orchestration.")
                        .version(version)
                        .contact(new Contact().name("VoicePilot Engineering").email("dev@voicepilot.ai"))
                        .license(new License().name("Proprietary").url("https://voicepilot.ai")));
    }
}
