package com.synchronoss.staffportal.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import com.synchronoss.staffportal.exception.InvalidTokenException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private final Key signingKey;
    private final long expirationMs;

    public JwtUtil(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs
    ) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Long userId, String email, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .setSubject(email)
                .claim("userId", userId)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(signingKey)
                    .build()
                    .parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims extractClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractEmail(String token) {
        return extractClaims(token).getSubject();
    }

    public Long extractUserId(String token) {
        Number userId = (Number) extractClaims(token).get("userId");
        return userId != null ? userId.longValue() : null;
    }

    public String extractRole(String token) {
        return (String) extractClaims(token).get("role");
    }

    public String generateGoogleRegistrationToken(String googleId, String email, String fullName) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + 600000L);

        return Jwts.builder()
                .setSubject(email)
                .claim("googleId", googleId)
                .claim("fullName", fullName)
                .claim("tokenType", "GOOGLE_REGISTRATION")
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateGoogleLinkToken(String googleId, String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + 600000L);

        return Jwts.builder()
                .setSubject(email)
                .claim("googleId", googleId)
                .claim("tokenType", "GOOGLE_LINK")
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims validateGoogleRegistrationToken(String token) {
        try {
            Claims claims = extractClaims(token);
            String tokenType = (String) claims.get("tokenType");
            if (!"GOOGLE_REGISTRATION".equals(tokenType)) {
                throw new InvalidTokenException("Invalid registration token type");
            }
            return claims;
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidTokenException("Registration token has expired or is invalid");
        }
    }

    public Claims validateGoogleLinkToken(String token) {
        try {
            Claims claims = extractClaims(token);
            String tokenType = (String) claims.get("tokenType");
            if (!"GOOGLE_LINK".equals(tokenType)) {
                throw new InvalidTokenException("Invalid account linking token type");
            }
            return claims;
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidTokenException("Linking token has expired or is invalid");
        }
    }

    public String generatePasswordResetToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + 600000L);

        return Jwts.builder()
                .setSubject(email)
                .claim("tokenType", "PASSWORD_RESET")
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public Claims validatePasswordResetToken(String token) {
        try {
            Claims claims = extractClaims(token);
            String tokenType = (String) claims.get("tokenType");
            if (!"PASSWORD_RESET".equals(tokenType)) {
                throw new InvalidTokenException("Invalid password reset token type");
            }
            return claims;
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidTokenException("Password reset authorization has expired or is invalid");
        }
    }
}
