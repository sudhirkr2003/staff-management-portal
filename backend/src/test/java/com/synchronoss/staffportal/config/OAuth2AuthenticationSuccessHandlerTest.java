package com.synchronoss.staffportal.config;

import com.synchronoss.staffportal.entity.User;
import com.synchronoss.staffportal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OAuth2AuthenticationSuccessHandlerTest {

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;

    @Mock
    private OAuth2User oAuth2User;

    private OAuth2AuthenticationSuccessHandler successHandler;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        successHandler = new OAuth2AuthenticationSuccessHandler(
                jwtUtil,
                userRepository,
                "http://localhost:3000"
        );
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @Test
    void onAuthenticationSuccess_ExistingAdminAccount_DirectLoginAndAutoLinks() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(oAuth2User.getAttribute("sub")).thenReturn("google-sub-456");
        when(oAuth2User.getAttribute("email")).thenReturn("admin@example.com");
        when(oAuth2User.getAttribute("email_verified")).thenReturn(true);
        when(oAuth2User.getAttribute("name")).thenReturn("Admin User");

        User existingAdmin = new User("Admin User", "admin@example.com", "hash", "ADMIN");
        existingAdmin.setId(1L);
        when(userRepository.findByEmail("admin@example.com")).thenReturn(Optional.of(existingAdmin));
        when(jwtUtil.generateToken(1L, "admin@example.com", "ADMIN")).thenReturn("adminJwtToken");

        successHandler.onAuthenticationSuccess(request, response, authentication);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.contains("status=login_success"));
        assertTrue(redirectUrl.contains("token=adminJwtToken"));
        org.junit.jupiter.api.Assertions.assertEquals("google-sub-456", existingAdmin.getGoogleId());
        org.junit.jupiter.api.Assertions.assertEquals("BOTH", existingAdmin.getAuthProvider());
        org.junit.jupiter.api.Assertions.assertEquals(true, existingAdmin.getEmailVerified());
        org.junit.jupiter.api.Assertions.assertEquals("ADMIN", existingAdmin.getRole());
    }

    @Test
    void onAuthenticationSuccess_ExistingUserAccount_DirectLoginAndAutoLinks() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(oAuth2User.getAttribute("sub")).thenReturn("google-sub-789");
        when(oAuth2User.getAttribute("email")).thenReturn("user@example.com");
        when(oAuth2User.getAttribute("email_verified")).thenReturn(true);
        when(oAuth2User.getAttribute("name")).thenReturn("Regular User");

        User existingUser = new User("Regular User", "user@example.com", "hash", "USER");
        existingUser.setId(2L);
        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(existingUser));
        when(jwtUtil.generateToken(2L, "user@example.com", "USER")).thenReturn("userJwtToken");

        successHandler.onAuthenticationSuccess(request, response, authentication);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.contains("status=login_success"));
        assertTrue(redirectUrl.contains("token=userJwtToken"));
        org.junit.jupiter.api.Assertions.assertEquals("google-sub-789", existingUser.getGoogleId());
        org.junit.jupiter.api.Assertions.assertEquals("BOTH", existingUser.getAuthProvider());
        org.junit.jupiter.api.Assertions.assertEquals(true, existingUser.getEmailVerified());
        org.junit.jupiter.api.Assertions.assertEquals("USER", existingUser.getRole());
    }

    @Test
    void onAuthenticationSuccess_SubsequentGoogleLogin_DirectLogin() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(oAuth2User.getAttribute("sub")).thenReturn("google-sub-123");
        when(oAuth2User.getAttribute("email")).thenReturn("user@gmail.com");
        when(oAuth2User.getAttribute("email_verified")).thenReturn(true);
        when(oAuth2User.getAttribute("name")).thenReturn("Google User");

        User existingUser = new User("Google User", "user@gmail.com", "hash", "USER", "google-sub-123", "BOTH", true);
        existingUser.setId(10L);
        when(userRepository.findByEmail("user@gmail.com")).thenReturn(Optional.of(existingUser));
        when(jwtUtil.generateToken(10L, "user@gmail.com", "USER")).thenReturn("jwtToken123");

        successHandler.onAuthenticationSuccess(request, response, authentication);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.contains("status=login_success"));
        assertTrue(redirectUrl.contains("token=jwtToken123"));
    }

    @Test
    void onAuthenticationSuccess_NewGoogleUser_RedirectsWithRegistrationToken() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(oAuth2User.getAttribute("sub")).thenReturn("google-sub-999");
        when(oAuth2User.getAttribute("email")).thenReturn("newuser@gmail.com");
        when(oAuth2User.getAttribute("email_verified")).thenReturn(true);
        when(oAuth2User.getAttribute("name")).thenReturn("New User");

        when(userRepository.findByGoogleId("google-sub-999")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("newuser@gmail.com")).thenReturn(Optional.empty());
        when(jwtUtil.generateGoogleRegistrationToken("google-sub-999", "newuser@gmail.com", "New User")).thenReturn("regToken999");

        successHandler.onAuthenticationSuccess(request, response, authentication);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.contains("status=google_register"));
        assertTrue(redirectUrl.contains("regToken=regToken999"));
        assertTrue(redirectUrl.contains("email=newuser@gmail.com"));
    }

    @Test
    void onAuthenticationSuccess_UnverifiedEmail_RedirectsWithError() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(oAuth2User.getAttribute("sub")).thenReturn("google-sub-unverified");
        when(oAuth2User.getAttribute("email")).thenReturn("unverified@gmail.com");
        when(oAuth2User.getAttribute("email_verified")).thenReturn(false);

        successHandler.onAuthenticationSuccess(request, response, authentication);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.contains("status=error"));
        assertTrue(redirectUrl.contains("verified"));
    }
}
