package com.synchronoss.staffportal.controller;

import com.synchronoss.staffportal.config.UserPrincipal;
import com.synchronoss.staffportal.dto.AdminRegistrationRequest;
import com.synchronoss.staffportal.dto.ApiResponse;
import com.synchronoss.staffportal.dto.ChangePasswordRequest;
import com.synchronoss.staffportal.dto.ForgotPasswordRequest;
import com.synchronoss.staffportal.dto.GoogleLinkAccountRequest;
import com.synchronoss.staffportal.dto.GoogleRegistrationRequest;
import com.synchronoss.staffportal.dto.LoginRequest;
import com.synchronoss.staffportal.dto.LoginResponse;
import com.synchronoss.staffportal.dto.OtpVerificationRequest;
import com.synchronoss.staffportal.dto.ResendOtpRequest;
import com.synchronoss.staffportal.dto.ResetPasswordRequest;
import com.synchronoss.staffportal.dto.UpdateProfileRequest;
import com.synchronoss.staffportal.dto.UserProfileResponse;
import com.synchronoss.staffportal.dto.VerifyResetOtpRequest;
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
                "Admin account registered successfully.",
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

    @PostMapping("/google/complete-registration")
    public ResponseEntity<ApiResponse<LoginResponse>> completeGoogleRegistration(@Valid @RequestBody GoogleRegistrationRequest request) {
        LoginResponse response = adminAuthService.completeGoogleRegistration(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, "Account created successfully", response));
    }

    @PostMapping("/google/link-account")
    public ResponseEntity<ApiResponse<LoginResponse>> linkGoogleAccount(@Valid @RequestBody GoogleLinkAccountRequest request) {
        LoginResponse response = adminAuthService.linkGoogleAccount(request);
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Account linked successfully", response));
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

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        if (principal == null) {
            throw new InvalidCredentialsException("Unauthorized access");
        }
        adminAuthService.changePassword(principal.getId(), request);
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Password changed successfully."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Map<String, String>>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        adminAuthService.sendPasswordResetOtp(request);
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                true,
                "If the email is registered, a password reset OTP has been sent.",
                Collections.singletonMap("email", request.getEmail().trim().toLowerCase())
        );
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/resend-reset-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> resendResetOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        adminAuthService.resendPasswordResetOtp(request);
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                true,
                "A new password reset OTP has been sent.",
                Collections.singletonMap("email", request.getEmail().trim().toLowerCase())
        );
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/verify-reset-otp")
    public ResponseEntity<ApiResponse<Map<String, String>>> verifyResetOtp(@Valid @RequestBody VerifyResetOtpRequest request) {
        String resetToken = adminAuthService.verifyPasswordResetOtp(request);
        ApiResponse<Map<String, String>> response = new ApiResponse<>(
                true,
                "OTP verified successfully.",
                Collections.singletonMap("resetToken", resetToken)
        );
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        adminAuthService.resetPassword(request);
        return ResponseEntity.status(HttpStatus.OK).body(new ApiResponse<>(true, "Password reset successfully."));
    }
}
