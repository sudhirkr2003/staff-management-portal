package com.synchronoss.staffportal.config;

import com.synchronoss.staffportal.entity.User;
import com.synchronoss.staffportal.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final String redirectBaseUrl;

    public OAuth2AuthenticationSuccessHandler(
            JwtUtil jwtUtil,
            UserRepository userRepository,
            @Value("${app.oauth2.authorized-redirect-url:http://localhost:3000}") String redirectBaseUrl
    ) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.redirectBaseUrl = redirectBaseUrl;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        if (response.isCommitted()) {
            return;
        }

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String googleId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        Boolean emailVerified = oAuth2User.getAttribute("email_verified");
        String fullName = oAuth2User.getAttribute("name");

        if (email == null || email.trim().isEmpty()) {
            String targetUrl = UriComponentsBuilder.fromUriString(redirectBaseUrl)
                    .queryParam("status", "error")
                    .queryParam("message", "Email not provided by Google")
                    .encode()
                    .toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
            return;
        }

        if (emailVerified == null || !emailVerified) {
            String targetUrl = UriComponentsBuilder.fromUriString(redirectBaseUrl)
                    .queryParam("status", "error")
                    .queryParam("message", "Google email is not verified")
                    .encode()
                    .toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
            return;
        }

        String normalizedEmail = email.toLowerCase().trim();

        Optional<User> userByEmail = userRepository.findByEmail(normalizedEmail);
        if (userByEmail.isPresent()) {
            User existingUser = userByEmail.get();
            if (existingUser.getGoogleId() == null || !existingUser.getGoogleId().equals(googleId)) {
                existingUser.setGoogleId(googleId);
                existingUser.setAuthProvider("BOTH");
                existingUser.setEmailVerified(true);
                userRepository.save(existingUser);
            }
            String token = jwtUtil.generateToken(existingUser.getId(), existingUser.getEmail(), existingUser.getRole());
            String targetUrl = UriComponentsBuilder.fromUriString(redirectBaseUrl)
                    .queryParam("status", "login_success")
                    .queryParam("token", token)
                    .encode()
                    .toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
            return;
        }

        Optional<User> userByGoogleId = userRepository.findByGoogleId(googleId);
        if (userByGoogleId.isPresent()) {
            User existingUser = userByGoogleId.get();
            String token = jwtUtil.generateToken(existingUser.getId(), existingUser.getEmail(), existingUser.getRole());
            String targetUrl = UriComponentsBuilder.fromUriString(redirectBaseUrl)
                    .queryParam("status", "login_success")
                    .queryParam("token", token)
                    .encode()
                    .toUriString();
            getRedirectStrategy().sendRedirect(request, response, targetUrl);
            return;
        }

        String regToken = jwtUtil.generateGoogleRegistrationToken(googleId, normalizedEmail, fullName != null ? fullName : "");
        String targetUrl = UriComponentsBuilder.fromUriString(redirectBaseUrl)
                .queryParam("status", "google_register")
                .queryParam("regToken", regToken)
                .queryParam("email", normalizedEmail)
                .queryParam("fullName", fullName != null ? fullName : "")
                .encode()
                .toUriString();
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}

