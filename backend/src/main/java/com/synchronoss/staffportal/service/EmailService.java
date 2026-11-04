package com.synchronoss.staffportal.service;

import com.synchronoss.staffportal.exception.EmailDeliveryException;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Staff Management Portal - Admin Registration OTP");
            message.setText("Dear Admin,\n\n"
                    + "Your One-Time Password (OTP) for admin registration is: " + otp + "\n\n"
                    + "This OTP is valid for 5 minutes.\n"
                    + "If you did not initiate this registration request, please disregard this email.\n\n"
                    + "Regards,\nStaff Management Portal Team");
            mailSender.send(message);
        } catch (MailException ex) {
            throw new EmailDeliveryException("Failed to send OTP email. Please ensure your email configuration is set up properly or try again later.", ex);
        }
    }

    public void sendPasswordResetOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Staff Management Portal - Password Reset OTP");
            message.setText("Hello,\n\n"
                    + "Your One-Time Password (OTP) for resetting your password is: " + otp + "\n\n"
                    + "This OTP is valid for 5 minutes.\n"
                    + "If you did not request a password reset, please disregard this email.\n\n"
                    + "Regards,\nStaff Management Portal Team");
            mailSender.send(message);
        } catch (MailException ex) {
            throw new EmailDeliveryException("Failed to send OTP email. Please ensure your email configuration is set up properly or try again later.", ex);
        }
    }
}
