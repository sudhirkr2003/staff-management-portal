package com.synchronoss.staffportal.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.ConnectException;
import java.net.NoRouteToHostException;
import java.net.SocketException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;

@Component
public class OAuth2AuthenticationFailureHandler extends SimpleUrlAuthenticationFailureHandler {

    private static final Logger failureLogger = LoggerFactory.getLogger(OAuth2AuthenticationFailureHandler.class);
    private final String redirectBaseUrl;

    public OAuth2AuthenticationFailureHandler(
            @Value("${app.oauth2.authorized-redirect-url:http://localhost:3000}") String redirectBaseUrl
    ) {
        this.redirectBaseUrl = redirectBaseUrl;
    }

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {
        String errorCategory = classifyError(exception);

        if (failureLogger.isWarnEnabled()) {
            failureLogger.warn("OAuth2 token exchange failure categorized as [{}]: {}", errorCategory, exception != null ? exception.getClass().getSimpleName() : "null");
        }

        String targetUrl = UriComponentsBuilder.fromUriString(redirectBaseUrl)
                .queryParam("status", "error")
                .queryParam("errorType", errorCategory)
                .encode()
                .toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String classifyError(AuthenticationException exception) {
        if (exception == null) {
            return "auth";
        }

        Throwable current = exception;
        boolean hasTimeout = false;
        boolean hasNetwork = false;

        while (current != null) {
            if (current instanceof SocketTimeoutException) {
                hasTimeout = true;
                break;
            }

            String currentName = current.getClass().getSimpleName();
            if (currentName.contains("Timeout")) {
                hasTimeout = true;
                break;
            }

            if (current instanceof UnknownHostException
                    || current instanceof ConnectException
                    || current instanceof NoRouteToHostException
                    || current instanceof SocketException) {
                hasNetwork = true;
            }

            String message = current.getMessage();
            if (message != null) {
                String lower = message.toLowerCase();
                if (lower.contains("timed out") || lower.contains("timeout")) {
                    hasTimeout = true;
                    break;
                }
                if (lower.contains("unexpected end of file")
                        || lower.contains("connection reset")
                        || lower.contains("broken pipe")
                        || lower.contains("i/o error")
                        || lower.contains("network is unreachable")
                        || lower.contains("connection refused")
                        || lower.contains("unknownhostexception")
                        || lower.contains("no route to host")) {
                    hasNetwork = true;
                }
            }

            current = current.getCause();
        }

        if (hasTimeout) {
            return "timeout";
        }
        if (hasNetwork) {
            return "network";
        }
        return "auth";
    }
}
