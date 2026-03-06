package com.example.info;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Simple health-check controller for info-service.
 * Returns a JSON response indicating the service is running.
 * Used by the frontend's "Check health" button and can be used
 * for Docker health checks or load balancer probes.
 */
@RestController
public class HealthController {

    /**
     * GET /api/health
     * Returns {"service": "info-service", "status": "UP"}
     */
    @GetMapping("/api/health")
    public Map<String, Object> health() {
        return Map.of("service", "info-service", "status", "UP");
    }
}