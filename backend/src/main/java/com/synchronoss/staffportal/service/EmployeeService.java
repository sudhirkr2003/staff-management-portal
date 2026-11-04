package com.synchronoss.staffportal.service;

import com.synchronoss.staffportal.dto.EmployeeRequest;
import com.synchronoss.staffportal.dto.EmployeeResponse;
import com.synchronoss.staffportal.entity.Company;
import com.synchronoss.staffportal.entity.Employee;
import com.synchronoss.staffportal.entity.User;
import com.synchronoss.staffportal.exception.EmailAlreadyExistsException;
import com.synchronoss.staffportal.exception.ForbiddenOperationException;
import com.synchronoss.staffportal.exception.ResourceNotFoundException;
import com.synchronoss.staffportal.repository.CompanyRepository;
import com.synchronoss.staffportal.repository.EmployeeRepository;
import com.synchronoss.staffportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;

    public EmployeeService(EmployeeRepository employeeRepository, UserRepository userRepository) {
        this(employeeRepository, userRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public EmployeeService(EmployeeRepository employeeRepository, UserRepository userRepository, CompanyRepository companyRepository) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
        this.companyRepository = companyRepository;
    }

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        Company company = null;
        if (companyRepository != null) {
            company = companyRepository.findByOwnerId(userId)
                    .orElseThrow(() -> new ForbiddenOperationException("You must register a company before creating employees"));
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (company != null) {
            if (employeeRepository.existsByEmailAndCompanyId(normalizedEmail, company.getId())) {
                throw new EmailAlreadyExistsException("An employee with this email already exists in your company");
            }
        } else if (employeeRepository.existsByEmailAndUserId(normalizedEmail, userId)) {
            throw new EmailAlreadyExistsException("An employee with this email already exists in your workspace");
        }

        Employee employee = new Employee(
                user,
                company,
                request.getFullName().trim(),
                normalizedEmail,
                request.getPhone().trim(),
                request.getDepartment().trim(),
                request.getDesignation().trim(),
                request.getSalary(),
                request.getJoiningDate()
        );

        Employee saved = employeeRepository.save(employee);
        return mapToResponse(saved);
    }

    public List<EmployeeResponse> getAllEmployees(Long userId) {
        if (companyRepository != null) {
            Company company = companyRepository.findByOwnerId(userId).orElse(null);
            if (company != null) {
                return employeeRepository.findByCompanyId(company.getId())
                        .stream()
                        .map(this::mapToResponse)
                        .collect(Collectors.toList());
            } else {
                return Collections.emptyList();
            }
        }

        return employeeRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public EmployeeResponse getEmployeeById(Long id, Long userId) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        verifyEmployeeOwnership(employee, userId);

        return mapToResponse(employee);
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request, Long userId) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        verifyEmployeeOwnership(employee, userId);

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (employee.getCompany() != null) {
            if (employeeRepository.existsByEmailAndCompanyIdAndIdNot(normalizedEmail, employee.getCompany().getId(), id)) {
                throw new EmailAlreadyExistsException("An employee with this email already exists in your company");
            }
        } else if (employeeRepository.existsByEmailAndUserIdAndIdNot(normalizedEmail, userId, id)) {
            throw new EmailAlreadyExistsException("An employee with this email already exists in your workspace");
        }

        employee.setFullName(request.getFullName().trim());
        employee.setEmail(normalizedEmail);
        employee.setPhone(request.getPhone().trim());
        employee.setDepartment(request.getDepartment().trim());
        employee.setDesignation(request.getDesignation().trim());
        employee.setSalary(request.getSalary());
        employee.setJoiningDate(request.getJoiningDate());

        Employee updated = employeeRepository.save(employee);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteEmployee(Long id, Long userId) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        verifyEmployeeOwnership(employee, userId);

        employeeRepository.delete(employee);
    }

    private void verifyEmployeeOwnership(Employee employee, Long userId) {
        if (employee.getCompany() != null && companyRepository != null) {
            Company userCompany = companyRepository.findByOwnerId(userId).orElse(null);
            if (userCompany == null || !employee.getCompany().getId().equals(userCompany.getId())) {
                throw new ForbiddenOperationException("Access denied: You do not own this employee record");
            }
        } else if (!employee.getUser().getId().equals(userId)) {
            throw new ForbiddenOperationException("Access denied: You do not own this employee record");
        }
    }

    private EmployeeResponse mapToResponse(Employee employee) {
        Long companyId = employee.getCompany() != null ? employee.getCompany().getId() : null;
        String companyName = employee.getCompany() != null ? employee.getCompany().getName() : null;

        return new EmployeeResponse(
                employee.getId(),
                employee.getUser().getId(),
                companyId,
                companyName,
                employee.getFullName(),
                employee.getEmail(),
                employee.getPhone(),
                employee.getDepartment(),
                employee.getDesignation(),
                employee.getSalary(),
                employee.getJoiningDate(),
                employee.getCreatedAt(),
                employee.getUpdatedAt()
        );
    }
}
