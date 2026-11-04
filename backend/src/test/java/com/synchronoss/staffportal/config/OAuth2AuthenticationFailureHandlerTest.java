package com.synchronoss.staffportal.config;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.web.client.ResourceAccessException;

import java.net.ConnectException;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OAuth2AuthenticationFailureHandlerTest {

    private OAuth2AuthenticationFailureHandler failureHandler;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        failureHandler = new OAuth2AuthenticationFailureHandler("http://localhost:3000");
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @Test
    void onAuthenticationFailure_WhenUnexpectedEof_RedirectsWithNetworkCategory() throws Exception {
        SocketException socketException = new SocketException("Unexpected end of file from server");
        ResourceAccessException resourceAccessException = new ResourceAccessException(
                "I/O error on POST request for \"https://www.googleapis.com/oauth2/v4/token\": Unexpected end of file from server",
                socketException
        );
        OAuth2AuthenticationException authException = new OAuth2AuthenticationException(
                new OAuth2Error("invalid_token_response", "An error occurred while attempting to retrieve the OAuth 2.0 Access Token", null),
                resourceAccessException
        );

        failureHandler.onAuthenticationFailure(request, response, authException);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.startsWith("http://localhost:3000"));
        assertTrue(redirectUrl.contains("status=error"));
        assertTrue(redirectUrl.contains("errorType=network"));
        assertFalse(redirectUrl.contains("Unexpected end of file"));
        assertFalse(redirectUrl.contains("googleapis.com"));
        assertFalse(redirectUrl.contains("invalid_token_response"));
    }

    @Test
    void onAuthenticationFailure_WhenUnknownHost_RedirectsWithNetworkCategory() throws Exception {
        UnknownHostException unknownHostException = new UnknownHostException("www.googleapis.com");
        ResourceAccessException resourceAccessException = new ResourceAccessException("I/O error", unknownHostException);
        OAuth2AuthenticationException authException = new OAuth2AuthenticationException(
                new OAuth2Error("invalid_token_response"),
                resourceAccessException
        );

        failureHandler.onAuthenticationFailure(request, response, authException);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.contains("status=error"));
        assertTrue(redirectUrl.contains("errorType=network"));
        assertFalse(redirectUrl.contains("UnknownHostException"));
        assertFalse(redirectUrl.contains("www.googleapis.com"));
    }

    @Test
    void onAuthenticationFailure_WhenConnectionRefused_RedirectsWithNetworkCategory() throws Exception {
        ConnectException connectException = new ConnectException("Connection refused: connect");
        ResourceAccessException resourceAccessException = new ResourceAccessException("I/O error", connectException);
        OAuth2AuthenticationException authException = new OAuth2AuthenticationException(
                new OAuth2Error("invalid_token_response"),
                resourceAccessException
        );

        failureHandler.onAuthenticationFailure(request, response, authException);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.contains("status=error"));
        assertTrue(redirectUrl.contains("errorType=network"));
    }

    @Test
    void onAuthenticationFailure_WhenSocketTimeout_RedirectsWithTimeoutCategory() throws Exception {
        SocketTimeoutException socketTimeoutException = new SocketTimeoutException("Read timed out");
        ResourceAccessException resourceAccessException = new ResourceAccessException("I/O error", socketTimeoutException);
        OAuth2AuthenticationException authException = new OAuth2AuthenticationException(
                new OAuth2Error("invalid_token_response"),
                resourceAccessException
        );

        failureHandler.onAuthenticationFailure(request, response, authException);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.contains("status=error"));
        assertTrue(redirectUrl.contains("errorType=timeout"));
        assertFalse(redirectUrl.contains("SocketTimeoutException"));
    }

    @Test
    void onAuthenticationFailure_WhenGenericOAuthError_RedirectsWithAuthCategory() throws Exception {
        OAuth2AuthenticationException authException = new OAuth2AuthenticationException(
                new OAuth2Error("invalid_grant", "Authorization code expired", null)
        );

        failureHandler.onAuthenticationFailure(request, response, authException);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.contains("status=error"));
        assertTrue(redirectUrl.contains("errorType=auth"));
        assertFalse(redirectUrl.contains("invalid_grant"));
        assertFalse(redirectUrl.contains("Authorization code expired"));
    }

    @Test
    void onAuthenticationFailure_WhenExceptionNull_RedirectsWithAuthCategory() throws Exception {
        failureHandler.onAuthenticationFailure(request, response, null);

        String redirectUrl = response.getRedirectedUrl();
        assertTrue(redirectUrl.contains("status=error"));
        assertTrue(redirectUrl.contains("errorType=auth"));
    }
}

