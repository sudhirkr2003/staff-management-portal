package com.synchronoss.staffportal.controller;

import com.synchronoss.staffportal.config.UserPrincipal;
import com.synchronoss.staffportal.dto.AdminRegistrationRequest;
import com.synchronoss.staffportal.dto.ApiResponse;
import com.synchronoss.staffportal.dto.LoginRequest;
import com.synchronoss.staffportal.dto.LoginResponse;
import com.synchronoss.staffportal.dto.OtpVerificationRequest;
import com.synchronoss.staffportal.dto.ResendOtpRequest;
import com.synchronoss.staffportal.dto.UpdateProfileRequest;
import com.synchronoss.staffportal.dto.UserProfileResponse;
import com.synchronoss.staffportal.exception.InvalidCredentialsException;
import com.synchronoss.staffportal.service.AdminAuthService;
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

import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    public AdminAuthController(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    @PostMapping("/admin/register")
    public ResponseEntity<ApiResponse<Map<String, String>>> registerAdmin(@Valid @RequestBody AdminRegistrationRequest request) {
        adminAuthService.registerAdmin(request);
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                true,
                "OTP has been sent to your email address.",
                Collections.singletonMap("email", request.getEmail().trim().toLowerCase())
        );
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/admin/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyOtp(@Valid @RequestBody OtpVerificationRequest request) {
        adminAuthService.verifyOtp(request);
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                true,
                "Admin account registered successfully.",
                Collections.singletonMap("email", request.getEmail().trim().toLowerCase())
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/admin/resend-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        adminAuthService.resendOtp(request);
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                true,
                "A new OTP has been sent to your email address.",
                Collections.singletonMap("email", request.getEmail().trim().toLowerCase())
        );
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = adminAuthService.login(request);
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Login successful", response));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            throw new InvalidCredentialsException("Unauthorized access");
        }
        UserProfileResponse profile = adminAuthService.getProfile(principal.getId());
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Profile retrieved successfully", profile));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        if (principal == null) {
            throw new InvalidCredentialsException("Unauthorized access");
        }
        UserProfileResponse updated = adminAuthService.updateProfile(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Profile updated successfully", updated));
    }
}
