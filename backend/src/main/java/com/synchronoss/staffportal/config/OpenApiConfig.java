package com.synchronoss.staffportal.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI staffManagementOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Staff Management Portal REST API")
                        .description("Comprehensive REST API documentation for Staff Management Portal, including Authentication, OTP verification, Company Workspace Management, and Employee CRUD operations.")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Staff Management Support")
                                .email("support@synchronoss.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("https://springdoc.org")))
                .addSecurityItem(new SecurityRequirement().addList("Bearer Authentication"))
                .components(new Components()
                        .addSecuritySchemes("Bearer Authentication", new SecurityScheme()
                                .name("Bearer Authentication")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Enter JWT Bearer token to authorize requests")));
    }
}

