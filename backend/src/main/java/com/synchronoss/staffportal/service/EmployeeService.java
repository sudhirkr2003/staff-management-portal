package com.synchronoss.staffportal.service;

import com.synchronoss.staffportal.dto.EmployeeRequest;
import com.synchronoss.staffportal.dto.EmployeeResponse;
import com.synchronoss.staffportal.entity.Employee;
import com.synchronoss.staffportal.entity.User;
import com.synchronoss.staffportal.exception.EmailAlreadyExistsException;
import com.synchronoss.staffportal.exception.ForbiddenOperationException;
import com.synchronoss.staffportal.exception.ResourceNotFoundException;
import com.synchronoss.staffportal.repository.EmployeeRepository;
import com.synchronoss.staffportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public EmployeeService(EmployeeRepository employeeRepository, UserRepository userRepository) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (employeeRepository.existsByEmailAndUserId(normalizedEmail, userId)) {
            throw new EmailAlreadyExistsException("An employee with this email already exists in your workspace");
        }

        Employee employee = new Employee(
                user,
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
        return employeeRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public EmployeeResponse getEmployeeById(Long id, Long userId) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        if (!employee.getUser().getId().equals(userId)) {
            throw new ForbiddenOperationException("Access denied: You do not own this employee record");
        }

        return mapToResponse(employee);
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request, Long userId) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        if (!employee.getUser().getId().equals(userId)) {
            throw new ForbiddenOperationException("Access denied: You do not own this employee record");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (employeeRepository.existsByEmailAndUserIdAndIdNot(normalizedEmail, userId, id)) {
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

        if (!employee.getUser().getId().equals(userId)) {
            throw new ForbiddenOperationException("Access denied: You do not own this employee record");
        }

        employeeRepository.delete(employee);
    }

    private EmployeeResponse mapToResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getUser().getId(),
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
