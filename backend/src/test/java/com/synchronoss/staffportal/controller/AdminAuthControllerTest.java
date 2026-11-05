package com.synchronoss.staffportal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.synchronoss.staffportal.config.JwtUtil;
import com.synchronoss.staffportal.dto.AdminRegistrationRequest;
import com.synchronoss.staffportal.dto.ChangePasswordRequest;
import com.synchronoss.staffportal.dto.ForgotPasswordRequest;
import com.synchronoss.staffportal.dto.GoogleLinkAccountRequest;
import com.synchronoss.staffportal.dto.GoogleRegistrationRequest;
import com.synchronoss.staffportal.dto.LoginRequest;
import com.synchronoss.staffportal.dto.LoginResponse;
import com.synchronoss.staffportal.dto.OtpVerificationRequest;
import com.synchronoss.staffportal.dto.ResendOtpRequest;
import com.synchronoss.staffportal.dto.ResetPasswordRequest;
import com.synchronoss.staffportal.dto.VerifyResetOtpRequest;
import com.synchronoss.staffportal.exception.EmailAlreadyExistsException;
import com.synchronoss.staffportal.exception.InvalidCredentialsException;
import com.synchronoss.staffportal.exception.InvalidOtpException;
import com.synchronoss.staffportal.exception.OtpCooldownException;
import com.synchronoss.staffportal.exception.OtpExpiredException;
import com.synchronoss.staffportal.exception.PasswordMismatchException;
import com.synchronoss.staffportal.service.AdminAuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AdminAuthService adminAuthService;

    @MockBean
    private JwtUtil jwtUtil;

    @Test
    void registerAdmin_ValidRequest_ReturnsOk() throws Exception {
        AdminRegistrationRequest request = new AdminRegistrationRequest(
                "Jane Doe",
                "admin@example.com",
                "Password@123",
                "Password@123"
        );
        doNothing().when(adminAuthService).registerAdmin(any(AdminRegistrationRequest.class));

        mockMvc.perform(post("/api/auth/admin/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Admin account registered successfully."))
                .andExpect(jsonPath("$.data.email").value("admin@example.com"));
    }

    @Test
    void registerAdmin_InvalidEmail_ReturnsBadRequest() throws Exception {
        AdminRegistrationRequest request = new AdminRegistrationRequest(
                "Jane Doe",
                "invalid-email",
                "Password@123",
                "Password@123"
        );

        mockMvc.perform(post("/api/auth/admin/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.data.email").value("Invalid email format"));
    }

    @Test
    void registerAdmin_WeakPassword_ReturnsBadRequest() throws Exception {
        AdminRegistrationRequest request = new AdminRegistrationRequest(
                "Jane Doe",
                "admin@example.com",
                "weak",
                "weak"
        );

        mockMvc.perform(post("/api/auth/admin/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.password").exists());
    }

    @Test
    void registerAdmin_PasswordMismatch_ReturnsBadRequest() throws Exception {
        AdminRegistrationRequest request = new AdminRegistrationRequest(
                "Jane Doe",
                "admin@example.com",
                "Password@123",
                "Password@999"
        );
        doThrow(new PasswordMismatchException("Password is not matching."))
                .when(adminAuthService).registerAdmin(any(AdminRegistrationRequest.class));

        mockMvc.perform(post("/api/auth/admin/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Password is not matching."));
    }

    @Test
    void registerAdmin_DuplicateEmail_ReturnsBadRequest() throws Exception {
        AdminRegistrationRequest request = new AdminRegistrationRequest(
                "Jane Doe",
                "admin@example.com",
                "Password@123",
                "Password@123"
        );
        doThrow(new EmailAlreadyExistsException("An account with this email address already exists"))
                .when(adminAuthService).registerAdmin(any(AdminRegistrationRequest.class));

        mockMvc.perform(post("/api/auth/admin/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("An account with this email address already exists"));
    }

    @Test
    void verifyOtp_ValidRequest_ReturnsCreated() throws Exception {
        OtpVerificationRequest request = new OtpVerificationRequest("admin@example.com", "123456");
        doNothing().when(adminAuthService).verifyOtp(any(OtpVerificationRequest.class));

        mockMvc.perform(post("/api/auth/admin/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Admin account registered successfully."));
    }

    @Test
    void verifyOtp_InvalidOtpDigits_ReturnsBadRequest() throws Exception {
        OtpVerificationRequest request = new OtpVerificationRequest("admin@example.com", "12");

        mockMvc.perform(post("/api/auth/admin/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.otp").value("OTP must be exactly 6 digits"));
    }

    @Test
    void verifyOtp_IncorrectOtpException_ReturnsBadRequest() throws Exception {
        OtpVerificationRequest request = new OtpVerificationRequest("admin@example.com", "123456");
        doThrow(new InvalidOtpException("Invalid OTP. You have 3 attempt(s) remaining."))
                .when(adminAuthService).verifyOtp(any(OtpVerificationRequest.class));

        mockMvc.perform(post("/api/auth/admin/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid OTP. You have 3 attempt(s) remaining."));
    }

    @Test
    void verifyOtp_ExpiredOtpException_ReturnsBadRequest() throws Exception {
        OtpVerificationRequest request = new OtpVerificationRequest("admin@example.com", "123456");
        doThrow(new OtpExpiredException("OTP has expired. Please request a new OTP."))
                .when(adminAuthService).verifyOtp(any(OtpVerificationRequest.class));

        mockMvc.perform(post("/api/auth/admin/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("OTP has expired. Please request a new OTP."));
    }

    @Test
    void resendOtp_CooldownException_ReturnsTooManyRequests() throws Exception {
        ResendOtpRequest request = new ResendOtpRequest("admin@example.com");
        doThrow(new OtpCooldownException("Please wait 45 seconds before requesting a new OTP."))
                .when(adminAuthService).resendOtp(any(ResendOtpRequest.class));

        mockMvc.perform(post("/api/auth/admin/resend-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Please wait 45 seconds before requesting a new OTP."));
    }

    @Test
    void login_ValidCredentials_ReturnsOkWithToken() throws Exception {
        LoginRequest request = new LoginRequest("admin@example.com", "Password@123");
        LoginResponse response = new LoginResponse("testToken", 1L, "Jane Doe", "admin@example.com", "ADMIN");
        when(adminAuthService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Login successful"))
                .andExpect(jsonPath("$.data.token").value("testToken"))
                .andExpect(jsonPath("$.data.fullName").value("Jane Doe"));
    }

    @Test
    void login_InvalidCredentials_ReturnsUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest("admin@example.com", "WrongPassword");
        doThrow(new InvalidCredentialsException("Invalid email or password"))
                .when(adminAuthService).login(any(LoginRequest.class));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void completeGoogleRegistration_ValidRequest_ReturnsCreated() throws Exception {
        GoogleRegistrationRequest request = new GoogleRegistrationRequest("validToken", "Password@123", "Password@123");
        LoginResponse response = new LoginResponse("testToken", 2L, "Google User", "user@gmail.com", "ADMIN");
        when(adminAuthService.completeGoogleRegistration(any(GoogleRegistrationRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/google/complete-registration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Account created successfully"))
                .andExpect(jsonPath("$.data.token").value("testToken"))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    void completeGoogleRegistration_WeakPassword_ReturnsBadRequest() throws Exception {
        GoogleRegistrationRequest request = new GoogleRegistrationRequest("validToken", "weak", "weak");

        mockMvc.perform(post("/api/auth/google/complete-registration")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.password").exists());
    }

    @Test
    void linkGoogleAccount_ValidRequest_ReturnsOk() throws Exception {
        GoogleLinkAccountRequest request = new GoogleLinkAccountRequest("linkToken", "Password@123");
        LoginResponse response = new LoginResponse("testToken", 1L, "Existing User", "existing@example.com", "ADMIN");
        when(adminAuthService.linkGoogleAccount(any(GoogleLinkAccountRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/google/link-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Account linked successfully"))
                .andExpect(jsonPath("$.data.token").value("testToken"));
    }

    @Test
    void linkGoogleAccount_BlankPassword_ReturnsBadRequest() throws Exception {
        GoogleLinkAccountRequest request = new GoogleLinkAccountRequest("linkToken", "");

        mockMvc.perform(post("/api/auth/google/link-account")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.password").exists());
    }

    @Test
    void changePassword_ValidRequest_ReturnsOk() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest("OldPass@123", "NewPass@123", "NewPass@123");
        io.jsonwebtoken.Claims claims = org.mockito.Mockito.mock(io.jsonwebtoken.Claims.class);
        when(claims.getSubject()).thenReturn("admin@example.com");
        when(claims.get("userId")).thenReturn(1L);
        when(claims.get("role")).thenReturn("ADMIN");

        when(jwtUtil.validateToken("testAuthToken")).thenReturn(true);
        when(jwtUtil.extractClaims("testAuthToken")).thenReturn(claims);
        doNothing().when(adminAuthService).changePassword(eq(1L), any(ChangePasswordRequest.class));

        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer testAuthToken")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Password changed successfully."));
    }

    @Test
    void forgotPassword_ValidEmail_ReturnsOk() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("user@example.com");
        doNothing().when(adminAuthService).sendPasswordResetOtp(any(ForgotPasswordRequest.class));

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("user@example.com"));
    }

    @Test
    void verifyResetOtp_ValidOtp_ReturnsOkWithToken() throws Exception {
        VerifyResetOtpRequest request = new VerifyResetOtpRequest("user@example.com", "123456");
        when(adminAuthService.verifyPasswordResetOtp(any(VerifyResetOtpRequest.class))).thenReturn("resetAuthToken");

        mockMvc.perform(post("/api/auth/verify-reset-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.resetToken").value("resetAuthToken"));
    }

    @Test
    void resetPassword_ValidRequest_ReturnsOk() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("validToken", "NewPassword@123", "NewPassword@123");
        doNothing().when(adminAuthService).resetPassword(any(ResetPasswordRequest.class));

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Password reset successfully."));
    }

    @Test
    void resetPassword_WeakPassword_ReturnsBadRequest() throws Exception {
        ResetPasswordRequest request = new ResetPasswordRequest("validToken", "weak", "weak");

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.data.newPassword").exists());
    }
}
