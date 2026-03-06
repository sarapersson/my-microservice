package com.example.info;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS (Cross-Origin Resource Sharing) configuration for info-service.
 *
 * Browsers block requests from one origin (e.g. localhost:8081) to another
 * (e.g. localhost:8080) by default. This config tells Spring Boot to allow
 * cross-origin requests so the frontend can talk to the backend.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")                                      // Apply to all endpoints
      .allowedOrigins("http://localhost:8081")                       // Allow requests from this origin
      .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")    // Allowed HTTP methods
      .allowedHeaders("*");                                         // Allow any request header
  }
}