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
import io.jsonwebtoken.Claims;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AdminAuthService {

    private final UserRepository userRepository;
    private final PendingRegistrationRepository pendingRegistrationRepository;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;
    private final SecureRandom secureRandom = new SecureRandom();

    public AdminAuthService(
            UserRepository userRepository,
            PendingRegistrationRepository pendingRegistrationRepository,
            PasswordResetOtpRepository passwordResetOtpRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            JwtUtil jwtUtil
    ) {
        this.userRepository = userRepository;
        this.pendingRegistrationRepository = pendingRegistrationRepository;
        this.passwordResetOtpRepository = passwordResetOtpRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public LoginResponse registerAdmin(AdminRegistrationRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("Password is not matching.");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new EmailAlreadyExistsException("An account with this email address already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User adminUser = new User(
                request.getFullName().trim(),
                normalizedEmail,
                hashedPassword,
                "ADMIN"
        );
        adminUser.setAuthProvider("LOCAL");
        adminUser.setEmailVerified(true);
        User savedUser = userRepository.save(adminUser);

        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), "ADMIN");
        return new LoginResponse(
                token,
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                "ADMIN"
        );
    }

    @Transactional
    public void verifyOtp(OtpVerificationRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        PendingRegistration pending = pendingRegistrationRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No pending registration found for this email address. Please register again."));

        if (pending.getFailedAttempts() >= 5) {
            throw new MaxOtpAttemptsException("Maximum verification attempts exceeded. Please request a new OTP.");
        }

        if (LocalDateTime.now().isAfter(pending.getOtpExpiry())) {
            throw new OtpExpiredException("OTP has expired. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(request.getOtp().trim(), pending.getOtpHash())) {
            int attempts = pending.getFailedAttempts() + 1;
            pending.setFailedAttempts(attempts);
            pendingRegistrationRepository.save(pending);

            int remaining = 5 - attempts;
            if (remaining <= 0) {
                throw new MaxOtpAttemptsException("Maximum verification attempts exceeded. Please request a new OTP.");
            }
            throw new InvalidOtpException("Invalid OTP. You have " + remaining + " attempt(s) remaining.");
        }

        if (userRepository.existsByEmail(normalizedEmail)) {
            pendingRegistrationRepository.delete(pending);
            throw new EmailAlreadyExistsException("An account with this email address already exists");
        }

        User adminUser = new User(
                pending.getFullName(),
                pending.getEmail(),
                pending.getPasswordHash(),
                "ADMIN"
        );
        adminUser.setAuthProvider("LOCAL");
        adminUser.setEmailVerified(true);

        userRepository.save(adminUser);
        pendingRegistrationRepository.delete(pending);
    }

    @Transactional
    public void resendOtp(ResendOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        PendingRegistration pending = pendingRegistrationRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No pending registration found for this email address."));

        long secondsElapsed = Duration.between(pending.getLastOtpSentAt(), LocalDateTime.now()).getSeconds();
        if (secondsElapsed < 60) {
            long waitSeconds = 60 - secondsElapsed;
            throw new OtpCooldownException("Please wait " + waitSeconds + " seconds before requesting a new OTP.");
        }

        String newOtp = generateSecureOtp();
        String hashedOtp = passwordEncoder.encode(newOtp);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.plusMinutes(5);

        pending.setOtpHash(hashedOtp);
        pending.setOtpExpiry(expiry);
        pending.setFailedAttempts(0);
        pending.setLastOtpSentAt(now);

        pendingRegistrationRepository.save(pending);

        emailService.sendOtpEmail(normalizedEmail, newOtp);
    }

    public LoginResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid email or password");
        }

        if (user.getRole() == null || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            user.setRole("ADMIN");
            user = userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), "ADMIN");

        return new LoginResponse(
                token,
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                "ADMIN"
        );
    }

    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRole() == null || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            user.setRole("ADMIN");
            user = userRepository.save(user);
        }

        return new UserProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                "ADMIN"
        );
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setFullName(request.getFullName().trim());
        user.setRole("ADMIN");
        User updated = userRepository.save(user);

        return new UserProfileResponse(
                updated.getId(),
                updated.getFullName(),
                updated.getEmail(),
                "ADMIN"
        );
    }

    @Transactional
    public LoginResponse completeGoogleRegistration(GoogleRegistrationRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("Password is not matching.");
        }

        Claims claims = jwtUtil.validateGoogleRegistrationToken(request.getRegistrationToken());
        String email = claims.getSubject().toLowerCase().trim();
        String googleId = (String) claims.get("googleId");
        String fullName = (String) claims.get("fullName");

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException("An account with this email address already exists");
        }

        if (userRepository.existsByGoogleId(googleId)) {
            throw new EmailAlreadyExistsException("This Google account is already registered");
        }

        User newUser = new User();
        newUser.setFullName(fullName != null && !fullName.trim().isEmpty() ? fullName.trim() : email);
        newUser.setEmail(email);
        newUser.setPassword(passwordEncoder.encode(request.getPassword()));
        newUser.setRole("ADMIN");
        newUser.setGoogleId(googleId);
        newUser.setAuthProvider("BOTH");
        newUser.setEmailVerified(true);

        User savedUser = userRepository.save(newUser);
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), "ADMIN");

        return new LoginResponse(
                token,
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                "ADMIN"
        );
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getPassword() == null || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Current password is incorrect.");
        }

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("Password is not matching.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        if ("GOOGLE".equals(user.getAuthProvider())) {
            user.setAuthProvider("BOTH");
        }
        userRepository.save(user);
    }

    @Transactional
    public void sendPasswordResetOtp(ForgotPasswordRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        Optional<User> userOptional = userRepository.findByEmail(normalizedEmail);
        if (userOptional.isEmpty()) {
            return;
        }

        Optional<PasswordResetOtp> existingOpt = passwordResetOtpRepository.findByEmail(normalizedEmail);
        if (existingOpt.isPresent()) {
            long secondsElapsed = Duration.between(existingOpt.get().getLastOtpSentAt(), LocalDateTime.now()).getSeconds();
            if (secondsElapsed < 60) {
                long waitSeconds = 60 - secondsElapsed;
                throw new OtpCooldownException("Please wait " + waitSeconds + " seconds before requesting a new OTP.");
            }
        }

        String generatedOtp = generateSecureOtp();
        String hashedOtp = passwordEncoder.encode(generatedOtp);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiry = now.plusMinutes(5);

        PasswordResetOtp resetOtp = existingOpt.orElseGet(() -> new PasswordResetOtp(
                normalizedEmail,
                hashedOtp,
                expiry,
                now
        ));
        resetOtp.setOtpHash(hashedOtp);
        resetOtp.setOtpExpiry(expiry);
        resetOtp.setFailedAttempts(0);
        resetOtp.setLastOtpSentAt(now);
        passwordResetOtpRepository.save(resetOtp);

        emailService.sendPasswordResetOtpEmail(normalizedEmail, generatedOtp);
    }

    @Transactional
    public void resendPasswordResetOtp(ForgotPasswordRequest request) {
        sendPasswordResetOtp(request);
    }

    @Transactional
    public String verifyPasswordResetOtp(VerifyResetOtpRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();

        PasswordResetOtp resetOtp = passwordResetOtpRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No active password reset request found for this email."));

        if (resetOtp.getFailedAttempts() >= 5) {
            throw new MaxOtpAttemptsException("Maximum verification attempts exceeded. Please request a new OTP.");
        }

        if (LocalDateTime.now().isAfter(resetOtp.getOtpExpiry())) {
            throw new OtpExpiredException("OTP has expired. Please request a new OTP.");
        }

        if (!passwordEncoder.matches(request.getOtp().trim(), resetOtp.getOtpHash())) {
            int attempts = resetOtp.getFailedAttempts() + 1;
            resetOtp.setFailedAttempts(attempts);
            passwordResetOtpRepository.save(resetOtp);

            int remaining = 5 - attempts;
            if (remaining <= 0) {
                throw new MaxOtpAttemptsException("Maximum verification attempts exceeded. Please request a new OTP.");
            }
            throw new InvalidOtpException("Invalid OTP. You have " + remaining + " attempt(s) remaining.");
        }

        passwordResetOtpRepository.delete(resetOtp);
        return jwtUtil.generatePasswordResetToken(normalizedEmail);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new PasswordMismatchException("Password is not matching.");
        }

        String email;
        if (request.getResetToken() != null && !request.getResetToken().isBlank()) {
            Claims claims = jwtUtil.validatePasswordResetToken(request.getResetToken());
            email = claims.getSubject().toLowerCase().trim();
        } else if (request.getEmail() != null && !request.getEmail().isBlank()) {
            email = request.getEmail().toLowerCase().trim();
        } else {
            throw new IllegalArgumentException("Email address or reset token is required");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email address"));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        if ("GOOGLE".equals(user.getAuthProvider())) {
            user.setAuthProvider("BOTH");
        }
        userRepository.save(user);
    }

    @Transactional
    public LoginResponse linkGoogleAccount(GoogleLinkAccountRequest request) {
        Claims claims = jwtUtil.validateGoogleLinkToken(request.getLinkToken());
        String email = claims.getSubject().toLowerCase().trim();
        String googleId = (String) claims.get("googleId");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email address"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new InvalidCredentialsException("Invalid password for existing account");
        }

        Optional<User> existingWithGoogle = userRepository.findByGoogleId(googleId);
        if (existingWithGoogle.isPresent() && !existingWithGoogle.get().getId().equals(user.getId())) {
            throw new EmailAlreadyExistsException("Google account is already linked to another user");
        }

        user.setGoogleId(googleId);
        user.setAuthProvider("BOTH");
        user.setEmailVerified(true);
        user.setRole("ADMIN");

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), "ADMIN");

        return new LoginResponse(
                token,
                savedUser.getId(),
                savedUser.getFullName(),
                savedUser.getEmail(),
                "ADMIN"
        );
    }

    private String generateSecureOtp() {
        int otpInt = 100000 + secureRandom.nextInt(900000);
        return String.valueOf(otpInt);
    }
}
