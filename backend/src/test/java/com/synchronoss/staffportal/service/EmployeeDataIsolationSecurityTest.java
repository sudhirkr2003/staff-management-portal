package com.synchronoss.staffportal.service;

import com.synchronoss.staffportal.dto.EmployeeRequest;
import com.synchronoss.staffportal.dto.EmployeeResponse;
import com.synchronoss.staffportal.entity.Employee;
import com.synchronoss.staffportal.entity.User;
import com.synchronoss.staffportal.exception.ForbiddenOperationException;
import com.synchronoss.staffportal.repository.EmployeeRepository;
import com.synchronoss.staffportal.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeDataIsolationSecurityTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private UserRepository userRepository;

    private EmployeeService employeeService;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        employeeService = new EmployeeService(employeeRepository, userRepository);

        userA = new User("Alice Admin", "alice@example.com", "hashA", "ADMIN");
        userA.setId(101L);

        userB = new User("Bob Admin", "bob@example.com", "hashB", "ADMIN");
        userB.setId(202L);
    }

    @Test
    void userA_CreateEmployee_Success() {
        EmployeeRequest request = new EmployeeRequest(
                "John Smith",
                "john.smith@example.com",
                "555-0100",
                "Engineering",
                "Software Engineer",
                new BigDecimal("85000.00"),
                LocalDate.of(2025, 1, 15)
        );

        when(userRepository.findById(101L)).thenReturn(Optional.of(userA));
        when(employeeRepository.existsByEmailAndUserId("john.smith@example.com", 101L)).thenReturn(false);

        Employee savedEmployee = new Employee(
                userA,
                request.getFullName(),
                request.getEmail(),
                request.getPhone(),
                request.getDepartment(),
                request.getDesignation(),
                request.getSalary(),
                request.getJoiningDate()
        );
        savedEmployee.setId(1L);

        when(employeeRepository.save(any(Employee.class))).thenReturn(savedEmployee);

        EmployeeResponse response = employeeService.createEmployee(request, 101L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(101L, response.getUserId());
        assertEquals("John Smith", response.getFullName());
    }

    @Test
    void userA_RetrieveOwnEmployee_Success() {
        Employee employeeA = new Employee(
                userA,
                "John Smith",
                "john.smith@example.com",
                "555-0100",
                "Engineering",
                "Software Engineer",
                new BigDecimal("85000.00"),
                LocalDate.of(2025, 1, 15)
        );
        employeeA.setId(1L);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employeeA));

        EmployeeResponse response = employeeService.getEmployeeById(1L, 101L);

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals(101L, response.getUserId());
    }

    @Test
    void userB_CannotRetrieveUserAEmployee_ThrowsForbidden() {
        Employee employeeA = new Employee(
                userA,
                "John Smith",
                "john.smith@example.com",
                "555-0100",
                "Engineering",
                "Software Engineer",
                new BigDecimal("85000.00"),
                LocalDate.of(2025, 1, 15)
        );
        employeeA.setId(1L);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employeeA));

        assertThrows(ForbiddenOperationException.class, () -> employeeService.getEmployeeById(1L, 202L));
    }

    @Test
    void userB_CannotSeeUserAEmployeesInList() {
        when(employeeRepository.findByUserId(202L)).thenReturn(Collections.emptyList());

        List<EmployeeResponse> list = employeeService.getAllEmployees(202L);

        assertTrue(list.isEmpty());
    }

    @Test
    void userB_CannotUpdateUserAEmployee_ThrowsForbidden() {
        Employee employeeA = new Employee(
                userA,
                "John Smith",
                "john.smith@example.com",
                "555-0100",
                "Engineering",
                "Software Engineer",
                new BigDecimal("85000.00"),
                LocalDate.of(2025, 1, 15)
        );
        employeeA.setId(1L);

        EmployeeRequest updateRequest = new EmployeeRequest(
                "John Hacked",
                "john.hacked@example.com",
                "555-9999",
                "Security",
                "Attacker",
                new BigDecimal("99000.00"),
                LocalDate.of(2025, 1, 15)
        );

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employeeA));

        assertThrows(ForbiddenOperationException.class, () -> employeeService.updateEmployee(1L, updateRequest, 202L));
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void userB_CannotDeleteUserAEmployee_ThrowsForbidden() {
        Employee employeeA = new Employee(
                userA,
                "John Smith",
                "john.smith@example.com",
                "555-0100",
                "Engineering",
                "Software Engineer",
                new BigDecimal("85000.00"),
                LocalDate.of(2025, 1, 15)
        );
        employeeA.setId(1L);

        when(employeeRepository.findById(1L)).thenReturn(Optional.of(employeeA));

        assertThrows(ForbiddenOperationException.class, () -> employeeService.deleteEmployee(1L, 202L));
        verify(employeeRepository, never()).delete(any());
    }

    @Test
    void userA_CannotAccessUserBEmployee_ReverseIsolation() {
        Employee employeeB = new Employee(
                userB,
                "Robert Davis",
                "robert.davis@example.com",
                "555-0200",
                "Finance",
                "Accountant",
                new BigDecimal("75000.00"),
                LocalDate.of(2025, 2, 1)
        );
        employeeB.setId(2L);

        when(employeeRepository.findById(2L)).thenReturn(Optional.of(employeeB));

        assertThrows(ForbiddenOperationException.class, () -> employeeService.getEmployeeById(2L, 101L));
        assertThrows(ForbiddenOperationException.class, () -> employeeService.deleteEmployee(2L, 101L));
    }
}
