package com.example.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * REST controller for authentication.
 * All endpoints are prefixed with /auth (e.g. /auth/login, /auth/validate).
 *
 * This is a simplified demo — it accepts any username/password and stores
 * tokens in memory (they are lost when the container restarts).
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    // Thread-safe set that stores all currently valid tokens in memory.
    // ConcurrentHashMap.newKeySet() is safe for concurrent access from multiple requests.
    private final Set<String> validTokens = ConcurrentHashMap.newKeySet();

    // Optional artificial delay (in ms) for token validation.
    // Configured via AUTH_DELAY_MS environment variable; defaults to 0 (no delay).
    // Useful for demonstrating latency in synchronous inter-service calls.
    @Value("${auth.delay.ms:0}")
    private long authDelayMs;

    /**
     * POST /auth/login
     * Accepts a JSON body with username and password.
     * For this demo, any credentials are accepted — a random UUID token is generated
     * and returned to the caller.
     */
    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> body) {
        // Generate a unique token and store it in the in-memory set
        String token = UUID.randomUUID().toString();
        validTokens.add(token);
        return Map.of("token", token);
    }

    /**
     * GET /auth/validate
     * Called by info-service (synchronous inter-service communication).
     * Checks if the Bearer token in the Authorization header is valid.
     * Returns 200 + user info if valid, or 401 if invalid/missing.
     */
    @GetMapping("/validate")
    public ResponseEntity<?> validate(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Artificial delay (if configured) — useful for testing latency
        try {
            if (authDelayMs > 0) Thread.sleep(authDelayMs);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Check that the Authorization header exists and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false));
        }

        // Extract the token (everything after "Bearer ")
        String token = authHeader.substring("Bearer ".length()).trim();

        // Look up the token in our in-memory store
        if (!validTokens.contains(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("valid", false));
        }

        // Token is valid — return user information
        return ResponseEntity.ok(Map.of(
                "valid", true,
                "userId", "sara",
                "roles", new String[]{"USER"}
        ));
    }

    /**
     * GET /auth/health
     * Simple health-check endpoint so we can verify the service is running.
     * Used by the frontend's "Check health" button and by Docker health checks.
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("service", "auth-service", "status", "UP");
    }
}