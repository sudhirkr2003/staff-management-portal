package com.synchronoss.staffportal.service;

import com.synchronoss.staffportal.config.JwtUtil;
import com.synchronoss.staffportal.dto.AdminRegistrationRequest;
import com.synchronoss.staffportal.dto.LoginRequest;
import com.synchronoss.staffportal.dto.LoginResponse;
import com.synchronoss.staffportal.dto.OtpVerificationRequest;
import com.synchronoss.staffportal.dto.ResendOtpRequest;
import com.synchronoss.staffportal.dto.UpdateProfileRequest;
import com.synchronoss.staffportal.dto.UserProfileResponse;
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
        when(pendingRegistrationRepository.findByEmail("admin@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedValue");

        adminAuthService.registerAdmin(request);

        ArgumentCaptor<PendingRegistration> captor = ArgumentCaptor.forClass(PendingRegistration.class);
        verify(pendingRegistrationRepository).save(captor.capture());
        PendingRegistration saved = captor.getValue();

        assertEquals("Jane Doe", saved.getFullName());
        assertEquals("admin@example.com", saved.getEmail());
        assertEquals("hashedValue", saved.getPasswordHash());
        assertEquals(0, saved.getFailedAttempts());
        assertNotNull(saved.getOtpExpiry());
        verify(emailService, times(1)).sendOtpEmail(eq("admin@example.com"), anyString());
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
        verify(emailService, never()).sendOtpEmail(anyString(), anyString());
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
        verify(pendingRegistrationRepository, never()).save(any());
        verify(emailService, never()).sendOtpEmail(anyString(), anyString());
    }

    @Test
    void registerAdmin_EmailDeliveryFailure_ThrowsException() {
        AdminRegistrationRequest request = new AdminRegistrationRequest(
                "Jane Doe",
                "admin@example.com",
                "Password@123",
                "Password@123"
        );

        when(userRepository.existsByEmail("admin@example.com")).thenReturn(false);
        when(pendingRegistrationRepository.findByEmail("admin@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("hashedValue");
        doThrow(new EmailDeliveryException("SMTP error")).when(emailService).sendOtpEmail(eq("admin@example.com"), anyString());

        assertThrows(EmailDeliveryException.class, () -> adminAuthService.registerAdmin(request));
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
}
