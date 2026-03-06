package com.example.info;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the info-service.
 * @SpringBootApplication tells Spring Boot to auto-configure and scan this package
 * for controllers, configurations, etc.
 *
 * This service runs on port 8080 (see application.properties).
 */
@SpringBootApplication
public class InfoServiceApplication {
    public static void main(String[] args) {
        // Starts the Spring Boot application (embedded Tomcat web server)
        SpringApplication.run(InfoServiceApplication.class, args);
    }
}
