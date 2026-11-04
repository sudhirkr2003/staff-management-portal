package com.synchronoss.staffportal.exception;

import com.synchronoss.staffportal.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            errors.put(error.getField(), error.getDefaultMessage());
        }
        ApiResponse<Map<String, String>> response = new ApiResponse<>(false, "Validation failed", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidCredentials(InvalidCredentialsException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }

    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbiddenOperation(ForbiddenOperationException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, "Access denied: You do not have permission to access this resource");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleEmailAlreadyExists(EmailAlreadyExistsException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(PasswordMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handlePasswordMismatch(PasswordMismatchException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<ApiResponse<Void>> handleInvalidOtp(InvalidOtpException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(OtpExpiredException.class)
    public ResponseEntity<ApiResponse<Void>> handleOtpExpired(OtpExpiredException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(MaxOtpAttemptsException.class)
    public ResponseEntity<ApiResponse<Void>> handleMaxOtpAttempts(MaxOtpAttemptsException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @ExceptionHandler(OtpCooldownException.class)
    public ResponseEntity<ApiResponse<Void>> handleOtpCooldown(OtpCooldownException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
    }

    @ExceptionHandler(EmailDeliveryException.class)
    public ResponseEntity<ApiResponse<Void>> handleEmailDelivery(EmailDeliveryException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneralException(Exception ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, "An unexpected error occurred: " + ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
