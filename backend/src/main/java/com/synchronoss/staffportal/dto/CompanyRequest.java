package com.synchronoss.staffportal.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CompanyRequest {

    @NotBlank(message = "Company name is required")
    @Size(min = 2, max = 150, message = "Company name must be between 2 and 150 characters")
    @JsonAlias({"name", "company_name"})
    private String companyName;

    @Size(max = 100, message = "Industry cannot exceed 100 characters")
    private String industry;

    @Email(message = "Please enter a valid business email")
    @Size(max = 150, message = "Business email cannot exceed 150 characters")
    @JsonAlias({"email", "business_email"})
    private String businessEmail;

    @Size(max = 30, message = "Contact phone cannot exceed 30 characters")
    @JsonAlias({"phone", "contact_phone"})
    private String contactPhone;

    @Size(max = 150, message = "Website cannot exceed 150 characters")
    private String website;

    public CompanyRequest() {
    }

    public CompanyRequest(String companyName, String industry, String businessEmail, String contactPhone, String website) {
        this.companyName = companyName;
        this.industry = industry;
        this.businessEmail = businessEmail;
        this.contactPhone = contactPhone;
        this.website = website;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getName() {
        return companyName;
    }

    public void setName(String name) {
        this.companyName = name;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getBusinessEmail() {
        return businessEmail;
    }

    public void setBusinessEmail(String businessEmail) {
        this.businessEmail = businessEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }
}

