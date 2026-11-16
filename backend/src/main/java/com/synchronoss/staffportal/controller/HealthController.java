package com.synchronoss.staffportal.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final JdbcTemplate jdbcTemplate;

    public HealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", "UP");
        body.put("service", "Staff Management Portal");
        body.put("timestamp", Instant.now().toString());

        try {
            Integer ping = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            String dbTime = jdbcTemplate.queryForObject("SELECT CURRENT_TIMESTAMP", String.class);
            body.put("database", (ping != null && ping == 1) ? "UP" : "UNKNOWN");
            body.put("databaseTime", dbTime);
            return ResponseEntity.ok(body);
        } catch (Exception ex) {
            body.put("status", "DOWN");
            body.put("database", "DOWN");
            body.put("databaseError", ex.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
        }
    }
}
