package com.example.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the auth-service.
 * @SpringBootApplication tells Spring Boot to auto-configure and scan this package
 * for controllers, configurations, etc.
 *
 * This service runs on port 8081 (see application.properties).
 */
@SpringBootApplication
public class AuthServiceApplication {
    public static void main(String[] args) {
        // Starts the Spring Boot application (embedded Tomcat web server)
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
