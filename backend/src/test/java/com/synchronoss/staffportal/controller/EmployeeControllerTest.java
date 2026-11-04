package com.synchronoss.staffportal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synchronoss.staffportal.config.JwtUtil;
import com.synchronoss.staffportal.dto.EmployeeRequest;
import com.synchronoss.staffportal.dto.EmployeeResponse;
import com.synchronoss.staffportal.exception.EmailAlreadyExistsException;
import com.synchronoss.staffportal.exception.ForbiddenOperationException;
import com.synchronoss.staffportal.exception.ResourceNotFoundException;
import com.synchronoss.staffportal.service.EmployeeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class EmployeeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @MockBean
    private EmployeeService employeeService;

    @Test
    void createEmployee_WhenValidRequest_ReturnsCreated() throws Exception {
        String token = jwtUtil.generateToken(1L, "user@example.com", "ADMIN");

        EmployeeRequest request = new EmployeeRequest(
                "Jane Doe",
                "jane.doe@example.com",
                "555-0199",
                "Engineering",
                "Software Engineer",
                new BigDecimal("80000.00"),
                LocalDate.of(2025, 2, 1)
        );

        EmployeeResponse response = new EmployeeResponse(
                10L,
                1L,
                "Jane Doe",
                "jane.doe@example.com",
                "555-0199",
                "Engineering",
                "Software Engineer",
                new BigDecimal("80000.00"),
                LocalDate.of(2025, 2, 1),
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(employeeService.createEmployee(any(EmployeeRequest.class), eq(1L))).thenReturn(response);

        mockMvc.perform(post("/api/employees")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Employee created successfully"))
                .andExpect(jsonPath("$.data.fullName").value("Jane Doe"))
                .andExpect(jsonPath("$.data.email").value("jane.doe@example.com"));
    }

    @Test
    void createEmployee_WhenDuplicateEmail_ReturnsBadRequest() throws Exception {
        String token = jwtUtil.generateToken(1L, "user@example.com", "ADMIN");

        EmployeeRequest request = new EmployeeRequest(
                "Jane Doe",
                "existing@example.com",
                "555-0199",
                "Engineering",
                "Software Engineer",
                new BigDecimal("80000.00"),
                LocalDate.of(2025, 2, 1)
        );

        when(employeeService.createEmployee(any(EmployeeRequest.class), eq(1L)))
                .thenThrow(new EmailAlreadyExistsException("An employee with this email already exists in your workspace"));

        mockMvc.perform(post("/api/employees")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("An employee with this email already exists in your workspace"));
    }

    @Test
    void createEmployee_WhenInvalidEmailOrSalary_ReturnsBadRequest() throws Exception {
        String token = jwtUtil.generateToken(1L, "user@example.com", "ADMIN");

        EmployeeRequest request = new EmployeeRequest(
                "",
                "invalid-email",
                "555",
                "Engineering",
                "Software Engineer",
                new BigDecimal("-500.00"),
                null
        );

        mockMvc.perform(post("/api/employees")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"));
    }

    @Test
    void createEmployee_WhenUnauthenticated_ReturnsUnauthorized() throws Exception {
        EmployeeRequest request = new EmployeeRequest(
                "Jane Doe",
                "jane.doe@example.com",
                "555-0199",
                "Engineering",
                "Software Engineer",
                new BigDecimal("80000.00"),
                LocalDate.of(2025, 2, 1)
        );

        mockMvc.perform(post("/api/employees")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getAllEmployees_WhenAuthenticated_ReturnsEmployees() throws Exception {
        String token = jwtUtil.generateToken(1L, "user@example.com", "ADMIN");

        when(employeeService.getAllEmployees(1L)).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/employees")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void deleteEmployee_WhenAdmin_ReturnsOk() throws Exception {
        String token = jwtUtil.generateToken(1L, "admin@example.com", "ADMIN");

        doNothing().when(employeeService).deleteEmployee(10L, 1L);

        mockMvc.perform(delete("/api/employees/10")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Employee deleted successfully"));
    }

    @Test
    void deleteEmployee_WhenUnauthenticated_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(delete("/api/employees/10"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteEmployee_WhenUserRole_ReturnsForbidden() throws Exception {
        String token = jwtUtil.generateToken(2L, "staff@example.com", "USER");

        mockMvc.perform(delete("/api/employees/10")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteEmployee_WhenNotFound_ReturnsNotFound() throws Exception {
        String token = jwtUtil.generateToken(1L, "admin@example.com", "ADMIN");

        doThrow(new ResourceNotFoundException("Employee not found with id: 99"))
                .when(employeeService).deleteEmployee(99L, 1L);

        mockMvc.perform(delete("/api/employees/99")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Employee not found with id: 99"));
    }

    @Test
    void deleteEmployee_WhenCrossCompany_ReturnsForbidden() throws Exception {
        String token = jwtUtil.generateToken(1L, "admin@example.com", "ADMIN");

        doThrow(new ForbiddenOperationException("Access denied: You do not own this employee record"))
                .when(employeeService).deleteEmployee(20L, 1L);

        mockMvc.perform(delete("/api/employees/20")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Access denied: You do not own this employee record"));
    }
}

