package com.synchronoss.staffportal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synchronoss.staffportal.config.JwtUtil;
import com.synchronoss.staffportal.dto.CompanyRequest;
import com.synchronoss.staffportal.dto.CompanyResponse;
import com.synchronoss.staffportal.service.CompanyService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CompanyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
    private CompanyService companyService;

    @Test
    void createCompany_Success() throws Exception {
        String token = jwtUtil.generateToken(1L, "admin@example.com", "ADMIN");

        CompanyRequest request = new CompanyRequest("Tech Corp", "Software", "info@techcorp.com", "+91 9876543210", "techcorp.com");

        CompanyResponse response = new CompanyResponse(
                1L,
                "Tech Corp",
                "Software",
                "info@techcorp.com",
                "+91 9876543210",
                "techcorp.com",
                1L,
                "Admin User",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(companyService.createCompany(any(CompanyRequest.class), eq(1L), eq("ADMIN"))).thenReturn(response);

        mockMvc.perform(post("/api/companies")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Company created successfully"))
                .andExpect(jsonPath("$.data.companyName").value("Tech Corp"));
    }

    @Test
    void getMyCompany_Success() throws Exception {
        String token = jwtUtil.generateToken(1L, "admin@example.com", "ADMIN");

        CompanyResponse response = new CompanyResponse(
                1L,
                "Tech Corp",
                "Software",
                "info@techcorp.com",
                "+91 9876543210",
                "techcorp.com",
                1L,
                "Admin User",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(companyService.getMyCompany(1L)).thenReturn(response);

        mockMvc.perform(get("/api/companies/my")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.companyName").value("Tech Corp"));
    }

    @Test
    void createCompany_UnauthorizedWithoutToken() throws Exception {
        CompanyRequest request = new CompanyRequest("Tech Corp", "Software", "info@techcorp.com", "+91 9876543210", "techcorp.com");

        mockMvc.perform(post("/api/companies")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void updateCompany_Success() throws Exception {
        String token = jwtUtil.generateToken(1L, "admin@example.com", "ADMIN");

        CompanyRequest request = new CompanyRequest("Updated Corp", "FinTech", "new@corp.com", "+91 9999999999", "new.com");

        CompanyResponse response = new CompanyResponse(
                1L,
                "Updated Corp",
                "FinTech",
                "new@corp.com",
                "+91 9999999999",
                "new.com",
                1L,
                "Admin User",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(companyService.updateMyCompany(any(CompanyRequest.class), eq(1L), eq("ADMIN"))).thenReturn(response);

        mockMvc.perform(put("/api/companies/my")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.companyName").value("Updated Corp"));
    }
}

