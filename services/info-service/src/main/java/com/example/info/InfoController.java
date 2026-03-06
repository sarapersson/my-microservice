package com.example.info;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.Map;

/**
 * REST controller for the info-service.
 * All endpoints are prefixed with /api (e.g. /api/info).
 *
 * This is the key part of the assignment: info-service makes a SYNCHRONOUS
 * HTTP call to auth-service to validate the user's token before returning data.
 * This demonstrates inter-service (container-to-container) communication.
 */
@RestController
@RequestMapping("/api")
public class InfoController {

    // RestTemplate is Spring's HTTP client for making synchronous (blocking) requests
    // to other services. We use it to call auth-service.
    private final RestTemplate restTemplate = new RestTemplate();

    // Base URL of auth-service, read from the AUTH_URL environment variable.
    // In Docker Compose this is set to "http://auth-service:8081" — Docker
    // resolves the hostname "auth-service" to the correct container IP.
    // Locally (without Docker) it defaults to "http://localhost:8081".
    @Value("${auth.url}")
    private String authUrl;

    /**
     * GET /api/info
     * Protected endpoint — requires a valid Bearer token in the Authorization header.
     *
     * Flow:
     *   1. Frontend sends GET /api/info with "Authorization: Bearer <token>"
     *   2. info-service forwards the token to auth-service GET /auth/validate
     *   3. auth-service checks the token and returns { valid: true/false }
     *   4. If valid, info-service returns the protected data to the frontend
     *
     * This synchronous call from one container to another fulfills the
     * "synkron kommunikation mellan containers" requirement.
     */
    @GetMapping("/info")
    public ResponseEntity<?> info(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        // If no Authorization header is provided, return 401 Unauthorized
        if (authHeader == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Missing token"));
        }

        // Measure how long the auth-service call takes (for demo/metrics)
        long start = System.currentTimeMillis();
        System.out.println("Calling auth-service /auth/validate ...");

        // Build an HTTP request with the same Authorization header to forward to auth-service
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", authHeader);

        // Make a synchronous GET request to auth-service's /auth/validate endpoint.
        // restTemplate.exchange() sends the request and waits (blocks) for the response.
        ResponseEntity<Map> validateResp = restTemplate.exchange(
                authUrl + "/auth/validate",
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
        );

        // Calculate how long the auth validation took
        long authValidationMs = System.currentTimeMillis() - start;

        // Check if auth-service said the token is valid
        Object valid = validateResp.getBody() != null ? validateResp.getBody().get("valid") : null;
        if (!(valid instanceof Boolean) || !((Boolean) valid)) {
            // Token is invalid — return 401 with timing info
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid token", "authValidationMs", authValidationMs));
        }

        // Token is valid — return the protected information
        return ResponseEntity.ok(Map.of(
                "message", "Här är din info!",
                "user", validateResp.getBody(),          // User data from auth-service
                "authValidationMs", authValidationMs,    // How long the sync call took
                "timestamp", Instant.now().toString()    // Current server time
        ));
    }
}
