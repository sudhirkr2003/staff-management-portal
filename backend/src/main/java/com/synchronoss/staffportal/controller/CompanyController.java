package com.synchronoss.staffportal.controller;

import com.synchronoss.staffportal.config.UserPrincipal;
import com.synchronoss.staffportal.dto.ApiResponse;
import com.synchronoss.staffportal.dto.CompanyRequest;
import com.synchronoss.staffportal.dto.CompanyResponse;
import org.springframework.security.access.AccessDeniedException;
import com.synchronoss.staffportal.exception.InvalidCredentialsException;
import com.synchronoss.staffportal.service.CompanyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {

    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CompanyResponse>> createCompany(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompanyRequest request
    ) {
        validateAdmin(principal);
        CompanyResponse response = companyService.createCompany(request, principal.getId(), principal.getRole());
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Company created successfully", response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<CompanyResponse>> getMyCompany(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        validateAdmin(principal);
        CompanyResponse response = companyService.getMyCompany(principal.getId());
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Company retrieved successfully", response));
    }

    @PutMapping({"", "/my"})
    public ResponseEntity<ApiResponse<CompanyResponse>> updateCompany(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompanyRequest request
    ) {
        validateAdmin(principal);
        CompanyResponse response = companyService.updateMyCompany(request, principal.getId(), principal.getRole());
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Company updated successfully", response));
    }

    private void validatePrincipal(UserPrincipal principal) {
        if (principal == null) {
            throw new InvalidCredentialsException("Unauthorized: Authentication token is missing or invalid");
        }
    }

    private void validateAdmin(UserPrincipal principal) {
        validatePrincipal(principal);
        if (principal.getRole() == null || !"ADMIN".equalsIgnoreCase(principal.getRole())) {
            throw new AccessDeniedException("Access denied: Only administrators can access company management");
        }
    }
}

