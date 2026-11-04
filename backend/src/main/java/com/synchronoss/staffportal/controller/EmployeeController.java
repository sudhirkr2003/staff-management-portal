package com.synchronoss.staffportal.controller;

import com.synchronoss.staffportal.config.UserPrincipal;
import com.synchronoss.staffportal.dto.ApiResponse;
import com.synchronoss.staffportal.dto.EmployeeRequest;
import com.synchronoss.staffportal.dto.EmployeeResponse;
import com.synchronoss.staffportal.exception.InvalidCredentialsException;
import com.synchronoss.staffportal.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EmployeeResponse>> createEmployee(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody EmployeeRequest request
    ) {
        validatePrincipal(principal);
        EmployeeResponse response = employeeService.createEmployee(request, principal.getId());
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Employee created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EmployeeResponse>>> getAllEmployees(@AuthenticationPrincipal UserPrincipal principal) {
        validatePrincipal(principal);
        List<EmployeeResponse> employees = employeeService.getAllEmployees(principal.getId());
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Employees retrieved successfully", employees));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getEmployeeById(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        validatePrincipal(principal);
        EmployeeResponse employee = employeeService.getEmployeeById(id, principal.getId());
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Employee retrieved successfully", employee));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EmployeeResponse>> updateEmployee(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody EmployeeRequest request
    ) {
        validatePrincipal(principal);
        EmployeeResponse updated = employeeService.updateEmployee(id, request, principal.getId());
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Employee updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteEmployee(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        validateAdmin(principal);
        employeeService.deleteEmployee(id, principal.getId());
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Employee deleted successfully"));
    }

    private void validatePrincipal(UserPrincipal principal) {
        if (principal == null) {
            throw new InvalidCredentialsException("Unauthorized: Authentication token is missing or invalid");
        }
    }

    private void validateAdmin(UserPrincipal principal) {
        validatePrincipal(principal);
        if (principal.getRole() == null || !"ADMIN".equalsIgnoreCase(principal.getRole())) {
            throw new AccessDeniedException("Access denied: Only administrators can delete employees");
        }
    }
}
