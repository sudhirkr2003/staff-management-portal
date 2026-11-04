package com.synchronoss.staffportal.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleLinkAccountRequest {

    @NotBlank(message = "Link token is required")
    private String linkToken;

    @NotBlank(message = "Password is required")
    private String password;

    public GoogleLinkAccountRequest() {
    }

    public GoogleLinkAccountRequest(String linkToken, String password) {
        this.linkToken = linkToken;
        this.password = password;
    }

    public String getLinkToken() {
        return linkToken;
    }

    public void setLinkToken(String linkToken) {
        this.linkToken = linkToken;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

