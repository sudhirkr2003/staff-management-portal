package com.synchronoss.staffportal.service;

import com.synchronoss.staffportal.exception.EmailDeliveryException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromEmail;

    public EmailService(JavaMailSender mailSender, @Value("${spring.mail.username:}") String fromEmail) {
        this.mailSender = mailSender;
        this.fromEmail = fromEmail;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(toEmail);
            message.setSubject("Staff Management Portal - Admin Registration OTP");
            message.setText("Dear Admin,\n\n"
                    + "Your One-Time Password (OTP) for admin registration is: " + otp + "\n\n"
                    + "This OTP is valid for 5 minutes.\n"
                    + "If you did not initiate this registration request, please disregard this email.\n\n"
                    + "Regards,\nStaff Management Portal Team");
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("Failed to send OTP email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new EmailDeliveryException("Failed to send OTP email. Please ensure your email configuration is set up properly or try again later.", ex);
        }
    }

    public void sendPasswordResetOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            if (fromEmail != null && !fromEmail.isBlank()) {
                message.setFrom(fromEmail);
            }
            message.setTo(toEmail);
            message.setSubject("Staff Management Portal - Password Reset OTP");
            message.setText("Hello,\n\n"
                    + "Your One-Time Password (OTP) for resetting your password is: " + otp + "\n\n"
                    + "This OTP is valid for 5 minutes.\n"
                    + "If you did not request a password reset, please disregard this email.\n\n"
                    + "Regards,\nStaff Management Portal Team");
            mailSender.send(message);
        } catch (MailException ex) {
            log.error("Failed to send password reset OTP email to {}: {}", toEmail, ex.getMessage(), ex);
            throw new EmailDeliveryException("Failed to send OTP email. Please ensure your email configuration is set up properly or try again later.", ex);
        }
    }
}
