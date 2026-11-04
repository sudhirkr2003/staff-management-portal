package com.synchronoss.staffportal.controller;

import com.synchronoss.staffportal.config.JwtUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtUtil jwtUtil;

    @Test
    void verifyAdminAccess_WhenAdminRole_ReturnsOk() throws Exception {
        String adminToken = jwtUtil.generateToken(1L, "admin@example.com", "ADMIN");

        mockMvc.perform(get("/api/admin/verify")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.adminAccess").value(true))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    void verifyAdminAccess_WhenUserRole_ReturnsForbidden() throws Exception {
        String userToken = jwtUtil.generateToken(2L, "user@example.com", "USER");

        mockMvc.perform(get("/api/admin/verify")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    void verifyAdminAccess_WhenUnauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/verify"))
                .andExpect(status().isUnauthorized());
    }
}
