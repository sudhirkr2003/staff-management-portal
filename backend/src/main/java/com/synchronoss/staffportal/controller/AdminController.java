package com.synchronoss.staffportal.controller;

import com.synchronoss.staffportal.config.UserPrincipal;
import com.synchronoss.staffportal.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @GetMapping("/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyAdminAccess(@AuthenticationPrincipal UserPrincipal principal) {
        Map<String, Object> data = new HashMap<>();
        data.put("adminAccess", true);
        data.put("userId", principal.getId());
        data.put("email", principal.getUsername());
        data.put("role", principal.getRole());
        return ResponseEntity.ok(new ApiResponse<>(true, "Administrator access confirmed", data));
    }
}

