package com.synchronoss.staffportal.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "pending_registrations")
public class PendingRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "otp_hash", nullable = false, length = 255)
    private String otpHash;

    @Column(name = "otp_expiry", nullable = false)
    private LocalDateTime otpExpiry;

    @Column(name = "failed_attempts", nullable = false)
    private int failedAttempts;

    @Column(name = "last_otp_sent_at", nullable = false)
    private LocalDateTime lastOtpSentAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PendingRegistration() {
    }

    public PendingRegistration(String fullName, String email, String passwordHash, String otpHash, LocalDateTime otpExpiry, LocalDateTime lastOtpSentAt) {
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.otpHash = otpHash;
        this.otpExpiry = otpExpiry;
        this.failedAttempts = 0;
        this.lastOtpSentAt = lastOtpSentAt;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getOtpHash() {
        return otpHash;
    }

    public void setOtpHash(String otpHash) {
        this.otpHash = otpHash;
    }

    public LocalDateTime getOtpExpiry() {
        return otpExpiry;
    }

    public void setOtpExpiry(LocalDateTime otpExpiry) {
        this.otpExpiry = otpExpiry;
    }

    public int getFailedAttempts() {
        return failedAttempts;
    }

    public void setFailedAttempts(int failedAttempts) {
        this.failedAttempts = failedAttempts;
    }

    public LocalDateTime getLastOtpSentAt() {
        return lastOtpSentAt;
    }

    public void setLastOtpSentAt(LocalDateTime lastOtpSentAt) {
        this.lastOtpSentAt = lastOtpSentAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
