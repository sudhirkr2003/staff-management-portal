package com.synchronoss.staffportal.service;

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
import com.synchronoss.staffportal.dto.UpdateProfileRequest;
import com.synchronoss.staffportal.dto.UserProfileResponse;
import com.synchronoss.staffportal.dto.VerifyResetOtpRequest;
import com.synchronoss.staffportal.entity.PasswordResetOtp;
import com.synchronoss.staffportal.entity.PendingRegistration;
import com.synchronoss.staffportal.entity.User;
import com.synchronoss.staffportal.exception.EmailAlreadyExistsException;
import com.synchronoss.staffportal.exception.EmailDeliveryException;
import com.synchronoss.staffportal.exception.InvalidCredentialsException;
import com.synchronoss.staffportal.exception.InvalidOtpException;
import com.synchronoss.staffportal.exception.MaxOtpAttemptsException;
import com.synchronoss.staffportal.exception.OtpCooldownException;
import com.synchronoss.staffportal.exception.OtpExpiredException;
import com.synchronoss.staffportal.exception.PasswordMismatchException;
import com.synchronoss.staffportal.exception.ResourceNotFoundException;
import com.synchronoss.staffportal.repository.PasswordResetOtpRepository;
import com.synchronoss.staffportal.repository.PendingRegistrationRepository;
import com.synchronoss.staffportal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PendingRegistrationRepository pendingRegistrationRepository;

    @Mock
    private PasswordResetOtpRepository passwordResetOtpRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private EmailService emailService;

    @Mock
    private JwtUtil jwtUtil;

    private AdminAuthService adminAuthService;

    @BeforeEach
    void setUp() {
        adminAuthService = new AdminAuthService(
                userRepository,
                pendingRegistrationRepository,
                passwordResetOtpRepository,
                passwordEncoder,
                emailService,
                jwtUtil
        );
    }

    @Test
    void registerAdmin_ValidRegistration_Success() {
        AdminRegistrationRequest request = new AdminRegistrationRequest(
                "Jane Doe",
                "admin@example.com",
                "Password@123",
                "Password@123"
        );

        when(userRepository.existsByEmail("admin@example.com")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashedValue");

        adminAuthService.registerAdmin(request);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();

        assertEquals("Jane Doe", saved.getFullName());
        assertEquals("admin@example.com", saved.getEmail());
        assertEquals("hashedValue", saved.getPassword());
        assertEquals("ADMIN", saved.getRole());
        assertEquals("LOCAL", saved.getAuthProvider());
        assertTrue(saved.getEmailVerified());
    }

    @Test
    void registerAdmin_PasswordMismatch_ThrowsException() {
        AdminRegistrationRequest request = new AdminRegistrationRequest(
                "Jane Doe",
                "admin@example.com",
                "Password@123",
                "Password@456"
        );

        assertThrows(PasswordMismatchException.class, () -> adminAuthService.registerAdmin(request));
        verify(userRepository, never()).existsByEmail(anyString());
    }

    @Test
    void registerAdmin_DuplicateEmail_ThrowsException() {
        AdminRegistrationRequest request = new AdminRegistrationRequest(
                "Jane Doe",
                "admin@example.com",
                "Password@123",
                "Password@123"
        );

        when(userRepository.existsByEmail("admin@example.com")).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> adminAuthService.registerAdmin(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void verifyOtp_CorrectOtp_SuccessAdminCreated() {
        OtpVerificationRequest request = new OtpVerificationRequest("admin@example.com", "123456");

        PendingRegistration pending = new PendingRegistration(
                "Jane Doe",
                "admin@example.com",
                "hashedPassword",
                "hashedOtp",
                LocalDateTime.now().plusMinutes(4),
                LocalDateTime.now()
        );

        when(pendingRegistrationRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(pending));
        when(passwordEncoder.matches("123456", "hashedOtp")).thenReturn(true);
        when(userRepository.existsByEmail("admin@example.com")).thenReturn(false);

        adminAuthService.verifyOtp(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User createdUser = userCaptor.getValue();

        assertEquals("Jane Doe", createdUser.getFullName());
        assertEquals("admin@example.com", createdUser.getEmail());
        assertEquals("ADMIN", createdUser.getRole());
        assertEquals("hashedPassword", createdUser.getPassword());
        verify(pendingRegistrationRepository).delete(pending);
    }

    @Test
    void verifyOtp_IncorrectOtp_IncrementsFailedAttempts() {
        OtpVerificationRequest request = new OtpVerificationRequest("admin@example.com", "999999");

        PendingRegistration pending = new PendingRegistration(
                "Jane Doe",
                "admin@example.com",
                "hashedPassword",
                "hashedOtp",
                LocalDateTime.now().plusMinutes(4),
                LocalDateTime.now()
        );
        pending.setFailedAttempts(1);

        when(pendingRegistrationRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(pending));
        when(passwordEncoder.matches("999999", "hashedOtp")).thenReturn(false);

        InvalidOtpException exception = assertThrows(InvalidOtpException.class, () -> adminAuthService.verifyOtp(request));
        assertTrue(exception.getMessage().contains("3 attempt(s) remaining"));
        assertEquals(2, pending.getFailedAttempts());
        verify(pendingRegistrationRepository).save(pending);
        verify(userRepository, never()).save(any());
    }

    @Test
    void verifyOtp_ExpiredOtp_ThrowsException() {
        OtpVerificationRequest request = new OtpVerificationRequest("admin@example.com", "123456");

        PendingRegistration pending = new PendingRegistration(
                "Jane Doe",
                "admin@example.com",
                "hashedPassword",
                "hashedOtp",
                LocalDateTime.now().minusMinutes(1),
                LocalDateTime.now().minusMinutes(6)
        );

        when(pendingRegistrationRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(pending));

        assertThrows(OtpExpiredException.class, () -> adminAuthService.verifyOtp(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void verifyOtp_MaxAttemptsExceeded_ThrowsException() {
        OtpVerificationRequest request = new OtpVerificationRequest("admin@example.com", "123456");

        PendingRegistration pending = new PendingRegistration(
                "Jane Doe",
                "admin@example.com",
                "hashedPassword",
                "hashedOtp",
                LocalDateTime.now().plusMinutes(3),
                LocalDateTime.now()
        );
        pending.setFailedAttempts(5);

        when(pendingRegistrationRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(pending));

        assertThrows(MaxOtpAttemptsException.class, () -> adminAuthService.verifyOtp(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void resendOtp_WithinCooldown_ThrowsException() {
        ResendOtpRequest request = new ResendOtpRequest("admin@example.com");

        PendingRegistration pending = new PendingRegistration(
                "Jane Doe",
                "admin@example.com",
                "hashedPassword",
                "hashedOtp",
                LocalDateTime.now().plusMinutes(4),
                LocalDateTime.now().minusSeconds(20)
        );

        when(pendingRegistrationRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(pending));

        assertThrows(OtpCooldownException.class, () -> adminAuthService.resendOtp(request));
        verify(emailService, never()).sendOtpEmail(anyString(), anyString());
    }

    @Test
    void resendOtp_AfterCooldown_GeneratesNewOtpAndSendsEmail() {
        ResendOtpRequest request = new ResendOtpRequest("admin@example.com");

        PendingRegistration pending = new PendingRegistration(
                "Jane Doe",
                "admin@example.com",
                "hashedPassword",
                "oldHashedOtp",
                LocalDateTime.now().minusMinutes(1),
                LocalDateTime.now().minusSeconds(65)
        );
        pending.setFailedAttempts(3);

        when(pendingRegistrationRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(pending));
        when(passwordEncoder.encode(anyString())).thenReturn("newHashedOtp");

        adminAuthService.resendOtp(request);

        assertEquals("newHashedOtp", pending.getOtpHash());
        assertEquals(0, pending.getFailedAttempts());
        assertTrue(pending.getOtpExpiry().isAfter(LocalDateTime.now()));
        verify(pendingRegistrationRepository).save(pending);
        verify(emailService, times(1)).sendOtpEmail(eq("admin@example.com"), anyString());
    }

    @Test
    void login_ValidCredentials_ReturnsLoginResponse() {
        LoginRequest request = new LoginRequest("admin@example.com", "Password@123");
        User user = new User("Jane Doe", "admin@example.com", "encodedHash", "ADMIN");
        user.setId(1L);

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("Password@123", "encodedHash")).thenReturn(true);
        when(jwtUtil.generateToken(1L, "admin@example.com", "ADMIN")).thenReturn("mockedJwtToken");

        LoginResponse response = adminAuthService.login(request);

        assertNotNull(response);
        assertEquals("mockedJwtToken", response.getToken());
        assertEquals(1L, response.getId());
        assertEquals("Jane Doe", response.getFullName());
        assertEquals("admin@example.com", response.getEmail());
    }

    @Test
    void login_InvalidPassword_ThrowsInvalidCredentials() {
        LoginRequest request = new LoginRequest("admin@example.com", "WrongPassword");
        User user = new User("Jane Doe", "admin@example.com", "encodedHash", "ADMIN");

        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "encodedHash")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> adminAuthService.login(request));
    }

    @Test
    void updateProfile_ValidName_UpdatesFullName() {
        UpdateProfileRequest request = new UpdateProfileRequest("Jane Updated");
        User user = new User("Jane Doe", "admin@example.com", "encodedHash", "ADMIN");
        user.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserProfileResponse response = adminAuthService.updateProfile(1L, request);

        assertEquals("Jane Updated", response.getFullName());
        assertEquals("admin@example.com", response.getEmail());
    }

    @Test
    void completeGoogleRegistration_Success_CreatesAdminRoleAccount() {
        GoogleRegistrationRequest request = new GoogleRegistrationRequest("validToken", "Password@123", "Password@123");
        io.jsonwebtoken.Claims claims = org.mockito.Mockito.mock(io.jsonwebtoken.Claims.class);
        when(claims.getSubject()).thenReturn("user@gmail.com");
        when(claims.get("googleId")).thenReturn("google-sub-123");
        when(claims.get("fullName")).thenReturn("Google User");

        when(jwtUtil.validateGoogleRegistrationToken("validToken")).thenReturn(claims);
        when(userRepository.existsByEmail("user@gmail.com")).thenReturn(false);
        when(userRepository.existsByGoogleId("google-sub-123")).thenReturn(false);
        when(passwordEncoder.encode("Password@123")).thenReturn("hashedPassword");

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(2L);
            return user;
        });
        when(jwtUtil.generateToken(2L, "user@gmail.com", "ADMIN")).thenReturn("jwtTokenUser");

        LoginResponse response = adminAuthService.completeGoogleRegistration(request);

        assertNotNull(response);
        assertEquals("jwtTokenUser", response.getToken());
        assertEquals("ADMIN", response.getRole());
        assertEquals("user@gmail.com", response.getEmail());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertEquals("ADMIN", saved.getRole());
        assertEquals("BOTH", saved.getAuthProvider());
        assertEquals(true, saved.getEmailVerified());
        assertEquals("google-sub-123", saved.getGoogleId());
    }

    @Test
    void completeGoogleRegistration_PasswordMismatch_ThrowsException() {
        GoogleRegistrationRequest request = new GoogleRegistrationRequest("validToken", "Password@123", "Mismatch@123");
        assertThrows(PasswordMismatchException.class, () -> adminAuthService.completeGoogleRegistration(request));
    }

    @Test
    void completeGoogleRegistration_EmailAlreadyExists_ThrowsException() {
        GoogleRegistrationRequest request = new GoogleRegistrationRequest("validToken", "Password@123", "Password@123");
        io.jsonwebtoken.Claims claims = org.mockito.Mockito.mock(io.jsonwebtoken.Claims.class);
        when(claims.getSubject()).thenReturn("existing@example.com");
        when(jwtUtil.validateGoogleRegistrationToken("validToken")).thenReturn(claims);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(EmailAlreadyExistsException.class, () -> adminAuthService.completeGoogleRegistration(request));
    }

    @Test
    void linkGoogleAccount_Success_UpdatesExistingUser() {
        GoogleLinkAccountRequest request = new GoogleLinkAccountRequest("linkToken", "Password@123");
        io.jsonwebtoken.Claims claims = org.mockito.Mockito.mock(io.jsonwebtoken.Claims.class);
        when(claims.getSubject()).thenReturn("existing@example.com");
        when(claims.get("googleId")).thenReturn("google-sub-456");

        when(jwtUtil.validateGoogleLinkToken("linkToken")).thenReturn(claims);

        User existingUser = new User("Existing User", "existing@example.com", "encodedHash", "ADMIN");
        existingUser.setId(1L);

        when(userRepository.findByEmail("existing@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("Password@123", "encodedHash")).thenReturn(true);
        when(userRepository.findByGoogleId("google-sub-456")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(jwtUtil.generateToken(1L, "existing@example.com", "ADMIN")).thenReturn("linkedJwtToken");

        LoginResponse response = adminAuthService.linkGoogleAccount(request);

        assertNotNull(response);
        assertEquals("linkedJwtToken", response.getToken());
        assertEquals("ADMIN", response.getRole());
        assertEquals("google-sub-456", existingUser.getGoogleId());
        assertEquals("BOTH", existingUser.getAuthProvider());
        assertEquals(true, existingUser.getEmailVerified());
    }

    @Test
    void linkGoogleAccount_InvalidPassword_ThrowsException() {
        GoogleLinkAccountRequest request = new GoogleLinkAccountRequest("linkToken", "WrongPassword");
        io.jsonwebtoken.Claims claims = org.mockito.Mockito.mock(io.jsonwebtoken.Claims.class);
        when(claims.getSubject()).thenReturn("existing@example.com");
        when(claims.get("googleId")).thenReturn("google-sub-456");

        when(jwtUtil.validateGoogleLinkToken("linkToken")).thenReturn(claims);

        User existingUser = new User("Existing User", "existing@example.com", "encodedHash", "ADMIN");
        when(userRepository.findByEmail("existing@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("WrongPassword", "encodedHash")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> adminAuthService.linkGoogleAccount(request));
    }

    @Test
    void changePassword_ValidCredentials_Success() {
        ChangePasswordRequest request = new ChangePasswordRequest("OldPass@123", "NewPass@123", "NewPass@123");
        User user = new User("Jane Doe", "jane@example.com", "encodedOld", "ADMIN");
        user.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPass@123", "encodedOld")).thenReturn(true);
        when(passwordEncoder.encode("NewPass@123")).thenReturn("encodedNew");

        adminAuthService.changePassword(1L, request);

        assertEquals("encodedNew", user.getPassword());
        verify(userRepository).save(user);
    }

    @Test
    void changePassword_IncorrectCurrentPassword_ThrowsInvalidCredentials() {
        ChangePasswordRequest request = new ChangePasswordRequest("WrongPass@123", "NewPass@123", "NewPass@123");
        User user = new User("Jane Doe", "jane@example.com", "encodedOld", "ADMIN");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPass@123", "encodedOld")).thenReturn(false);

        assertThrows(InvalidCredentialsException.class, () -> adminAuthService.changePassword(1L, request));
    }

    @Test
    void changePassword_PasswordMismatch_ThrowsPasswordMismatchException() {
        ChangePasswordRequest request = new ChangePasswordRequest("OldPass@123", "NewPass@123", "DifferentPass@123");
        User user = new User("Jane Doe", "jane@example.com", "encodedOld", "ADMIN");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPass@123", "encodedOld")).thenReturn(true);

        assertThrows(PasswordMismatchException.class, () -> adminAuthService.changePassword(1L, request));
    }

    @Test
    void sendPasswordResetOtp_RegisteredEmail_SendsOtp() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("user@example.com");
        User user = new User("Jane Doe", "user@example.com", "hash", "ADMIN");

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordResetOtpRepository.findByEmail("user@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedOtp");

        adminAuthService.sendPasswordResetOtp(request);

        verify(passwordResetOtpRepository).save(any(PasswordResetOtp.class));
        verify(emailService).sendPasswordResetOtpEmail(eq("user@example.com"), anyString());
    }

    @Test
    void sendPasswordResetOtp_UnregisteredEmail_SilentlyCompletes() {
        ForgotPasswordRequest request = new ForgotPasswordRequest("nonexistent@example.com");
        when(userRepository.findByEmail("nonexistent@example.com")).thenReturn(Optional.empty());

        adminAuthService.sendPasswordResetOtp(request);

        verify(passwordResetOtpRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetOtpEmail(anyString(), anyString());
    }

    @Test
    void verifyPasswordResetOtp_ValidOtp_ReturnsTokenAndDeletesOtp() {
        VerifyResetOtpRequest request = new VerifyResetOtpRequest("user@example.com", "123456");
        PasswordResetOtp otpRecord = new PasswordResetOtp("user@example.com", "hashedOtp", LocalDateTime.now().plusMinutes(5), LocalDateTime.now());

        when(passwordResetOtpRepository.findByEmail("user@example.com")).thenReturn(Optional.of(otpRecord));
        when(passwordEncoder.matches("123456", "hashedOtp")).thenReturn(true);
        when(jwtUtil.generatePasswordResetToken("user@example.com")).thenReturn("resetAuthToken");

        String token = adminAuthService.verifyPasswordResetOtp(request);

        assertEquals("resetAuthToken", token);
        verify(passwordResetOtpRepository).delete(otpRecord);
    }

    @Test
    void verifyPasswordResetOtp_InvalidOtp_IncrementsAttempts() {
        VerifyResetOtpRequest request = new VerifyResetOtpRequest("user@example.com", "999999");
        PasswordResetOtp otpRecord = new PasswordResetOtp("user@example.com", "hashedOtp", LocalDateTime.now().plusMinutes(5), LocalDateTime.now());

        when(passwordResetOtpRepository.findByEmail("user@example.com")).thenReturn(Optional.of(otpRecord));
        when(passwordEncoder.matches("999999", "hashedOtp")).thenReturn(false);

        assertThrows(InvalidOtpException.class, () -> adminAuthService.verifyPasswordResetOtp(request));
        assertEquals(1, otpRecord.getFailedAttempts());
        verify(passwordResetOtpRepository).save(otpRecord);
    }

    @Test
    void resetPassword_ValidToken_UpdatesPassword() {
        ResetPasswordRequest request = new ResetPasswordRequest("validToken", "NewPassword@123", "NewPassword@123");
        io.jsonwebtoken.Claims claims = org.mockito.Mockito.mock(io.jsonwebtoken.Claims.class);
        when(claims.getSubject()).thenReturn("user@example.com");

        when(jwtUtil.validatePasswordResetToken("validToken")).thenReturn(claims);
        User user = new User("Jane Doe", "user@example.com", "oldHash", "ADMIN");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewPassword@123")).thenReturn("newHashedPassword");

        adminAuthService.resetPassword(request);

        assertEquals("newHashedPassword", user.getPassword());
        verify(userRepository).save(user);
    }

    @Test
    void resetPassword_ValidEmail_UpdatesPassword() {
        ResetPasswordRequest request = new ResetPasswordRequest("user@example.com", null, "NewPassword@123", "NewPassword@123");
        User user = new User("Jane Doe", "user@example.com", "oldHash", "ADMIN");
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewPassword@123")).thenReturn("newHashedPassword");

        adminAuthService.resetPassword(request);

        assertEquals("newHashedPassword", user.getPassword());
        verify(userRepository).save(user);
    }
}
