package com.synchronoss.staffportal.dto;

public class UserProfileResponse {

    private Long id;
    private String fullName;
    private String email;
    private String role;
    private Boolean hasCompany = false;
    private String companyName;

    public UserProfileResponse() {
    }

    public UserProfileResponse(Long id, String fullName, String email, String role) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.hasCompany = false;
        this.companyName = null;
    }

    public UserProfileResponse(Long id, String fullName, String email, String role, Boolean hasCompany, String companyName) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.role = role;
        this.hasCompany = hasCompany != null && hasCompany;
        this.companyName = companyName;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Boolean getHasCompany() {
        return hasCompany;
    }

    public void setHasCompany(Boolean hasCompany) {
        this.hasCompany = hasCompany != null && hasCompany;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }
}
