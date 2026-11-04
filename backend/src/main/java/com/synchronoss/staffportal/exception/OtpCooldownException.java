package com.synchronoss.staffportal.exception;

public class OtpCooldownException extends RuntimeException {
    public OtpCooldownException(String message) {
        super(message);
    }
}
