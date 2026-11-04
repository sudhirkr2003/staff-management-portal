package com.synchronoss.staffportal.exception;

public class MaxOtpAttemptsException extends RuntimeException {
    public MaxOtpAttemptsException(String message) {
        super(message);
    }
}
