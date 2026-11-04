package com.synchronoss.staffportal.service;

import com.synchronoss.staffportal.dto.CompanyRequest;
import com.synchronoss.staffportal.dto.CompanyResponse;
import com.synchronoss.staffportal.entity.Company;
import com.synchronoss.staffportal.entity.Employee;
import com.synchronoss.staffportal.entity.User;
import com.synchronoss.staffportal.exception.ForbiddenOperationException;
import com.synchronoss.staffportal.exception.ResourceNotFoundException;
import com.synchronoss.staffportal.repository.CompanyRepository;
import com.synchronoss.staffportal.repository.EmployeeRepository;
import com.synchronoss.staffportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public CompanyService(CompanyRepository companyRepository, UserRepository userRepository, EmployeeRepository employeeRepository) {
        this.companyRepository = companyRepository;
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional
    public CompanyResponse createCompany(CompanyRequest request, Long ownerId, String role) {
        if (role == null || !role.toUpperCase().contains("ADMIN")) {
            throw new ForbiddenOperationException("Only ADMIN users can register a company");
        }

        if (companyRepository.existsByOwnerId(ownerId)) {
            throw new ForbiddenOperationException("You have already registered a company");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        Company company = new Company();
        company.setName(request.getCompanyName().trim());
        company.setIndustry(request.getIndustry() != null && !request.getIndustry().trim().isEmpty() ? request.getIndustry().trim() : null);
        company.setBusinessEmail(request.getBusinessEmail() != null && !request.getBusinessEmail().trim().isEmpty() ? request.getBusinessEmail().trim().toLowerCase() : null);
        company.setContactPhone(request.getContactPhone() != null && !request.getContactPhone().trim().isEmpty() ? request.getContactPhone().trim() : null);
        company.setWebsite(request.getWebsite() != null && !request.getWebsite().trim().isEmpty() ? request.getWebsite().trim() : null);
        company.setOwner(owner);

        Company saved = companyRepository.save(company);

        List<Employee> existingEmployees = employeeRepository.findByUserId(ownerId);
        for (Employee emp : existingEmployees) {
            if (emp.getCompany() == null) {
                emp.setCompany(saved);
                employeeRepository.save(emp);
            }
        }

        return mapToResponse(saved);
    }

    public CompanyResponse getMyCompany(Long ownerId) {
        return companyRepository.findByOwnerId(ownerId)
                .map(this::mapToResponse)
                .orElse(null);
    }

    @Transactional
    public CompanyResponse updateMyCompany(CompanyRequest request, Long ownerId, String role) {
        if (role == null || !role.toUpperCase().contains("ADMIN")) {
            throw new ForbiddenOperationException("Only ADMIN users can update company details");
        }

        Company company = companyRepository.findByOwnerId(ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("No company registered for this user"));

        if (request.getCompanyName() == null || request.getCompanyName().trim().isEmpty()) {
            throw new IllegalArgumentException("Company name is required");
        }

        company.setName(request.getCompanyName().trim());
        company.setIndustry(request.getIndustry() != null && !request.getIndustry().trim().isEmpty() ? request.getIndustry().trim() : null);
        company.setBusinessEmail(request.getBusinessEmail() != null && !request.getBusinessEmail().trim().isEmpty() ? request.getBusinessEmail().trim().toLowerCase() : null);
        company.setContactPhone(request.getContactPhone() != null && !request.getContactPhone().trim().isEmpty() ? request.getContactPhone().trim() : null);
        company.setWebsite(request.getWebsite() != null && !request.getWebsite().trim().isEmpty() ? request.getWebsite().trim() : null);

        Company saved = companyRepository.save(company);
        return mapToResponse(saved);
    }

    public CompanyResponse getCompanyById(Long companyId, Long requesterId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found"));

        if (!company.getOwner().getId().equals(requesterId)) {
            throw new ForbiddenOperationException("Access denied: You do not have permission to view this company");
        }

        return mapToResponse(company);
    }

    private CompanyResponse mapToResponse(Company company) {
        return new CompanyResponse(
                company.getId(),
                company.getName(),
                company.getIndustry(),
                company.getBusinessEmail(),
                company.getContactPhone(),
                company.getWebsite(),
                company.getOwner().getId(),
                company.getOwner().getFullName(),
                company.getCreatedAt(),
                company.getUpdatedAt()
        );
    }
}

