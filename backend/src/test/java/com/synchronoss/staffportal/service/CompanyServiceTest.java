package com.synchronoss.staffportal.service;

import com.synchronoss.staffportal.dto.CompanyRequest;
import com.synchronoss.staffportal.dto.CompanyResponse;
import com.synchronoss.staffportal.dto.EmployeeRequest;
import com.synchronoss.staffportal.dto.EmployeeResponse;
import com.synchronoss.staffportal.entity.Company;
import com.synchronoss.staffportal.entity.Employee;
import com.synchronoss.staffportal.entity.User;
import com.synchronoss.staffportal.exception.ForbiddenOperationException;
import com.synchronoss.staffportal.repository.CompanyRepository;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CompanyServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    private CompanyService companyService;
    private EmployeeService employeeService;

    private User adminUser;
    private User regularUser;

    @BeforeEach
    void setUp() {
        companyService = new CompanyService(companyRepository, userRepository, employeeRepository);
        employeeService = new EmployeeService(employeeRepository, userRepository, companyRepository);

        adminUser = new User("Admin John", "admin@example.com", "hash", "ADMIN");
        adminUser.setId(10L);

        regularUser = new User("Regular User", "user@example.com", "hash", "USER");
        regularUser.setId(20L);
    }

    @Test
    void createCompany_Success() {
        CompanyRequest request = new CompanyRequest("Acme Corp", "Tech", "biz@acme.com", "1234567890", "acme.com");

        when(companyRepository.existsByOwnerId(10L)).thenReturn(false);
        when(userRepository.findById(10L)).thenReturn(Optional.of(adminUser));

        Company savedCompany = new Company("Acme Corp", "Tech", "biz@acme.com", "1234567890", "acme.com", adminUser);
        savedCompany.setId(100L);

        when(companyRepository.save(any(Company.class))).thenReturn(savedCompany);
        when(employeeRepository.findByUserId(10L)).thenReturn(Collections.emptyList());

        CompanyResponse response = companyService.createCompany(request, 10L, "ADMIN");

        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("Acme Corp", response.getCompanyName());
        assertEquals(10L, response.getOwnerId());
    }

    @Test
    void createCompany_WhenNotAdmin_ThrowsForbidden() {
        CompanyRequest request = new CompanyRequest("Acme Corp", "Tech", "biz@acme.com", "1234567890", "acme.com");

        assertThrows(ForbiddenOperationException.class, () -> companyService.createCompany(request, 20L, "USER"));
    }

    @Test
    void createCompany_WhenAlreadyExists_ThrowsForbidden() {
        CompanyRequest request = new CompanyRequest("Acme Corp", "Tech", "biz@acme.com", "1234567890", "acme.com");

        when(companyRepository.existsByOwnerId(10L)).thenReturn(true);

        assertThrows(ForbiddenOperationException.class, () -> companyService.createCompany(request, 10L, "ADMIN"));
    }

    @Test
    void createCompany_BackfillsExistingEmployees() {
        CompanyRequest request = new CompanyRequest("Acme Corp", "Tech", "biz@acme.com", "1234567890", "acme.com");

        when(companyRepository.existsByOwnerId(10L)).thenReturn(false);
        when(userRepository.findById(10L)).thenReturn(Optional.of(adminUser));

        Company savedCompany = new Company("Acme Corp", "Tech", "biz@acme.com", "1234567890", "acme.com", adminUser);
        savedCompany.setId(100L);

        Employee existingEmp = new Employee(adminUser, "Old Emp", "old@acme.com", "111", "Dept", "Eng", new BigDecimal("50000"), LocalDate.now());
        existingEmp.setId(5L);

        when(companyRepository.save(any(Company.class))).thenReturn(savedCompany);
        when(employeeRepository.findByUserId(10L)).thenReturn(List.of(existingEmp));

        CompanyResponse response = companyService.createCompany(request, 10L, "ADMIN");

        assertNotNull(response);
        verify(employeeRepository).save(existingEmp);
        assertEquals(savedCompany, existingEmp.getCompany());
    }

    @Test
    void employeeCreation_WithoutCompany_ThrowsForbidden() {
        EmployeeRequest req = new EmployeeRequest("Bob", "bob@acme.com", "123", "IT", "Dev", new BigDecimal("60000"), LocalDate.now());

        when(userRepository.findById(10L)).thenReturn(Optional.of(adminUser));
        when(companyRepository.findByOwnerId(10L)).thenReturn(Optional.empty());

        assertThrows(ForbiddenOperationException.class, () -> employeeService.createEmployee(req, 10L));
    }

    @Test
    void employeeCreation_WithCompany_AssociatesCompany() {
        EmployeeRequest req = new EmployeeRequest("Bob", "bob@acme.com", "123", "IT", "Dev", new BigDecimal("60000"), LocalDate.now());

        Company company = new Company("Acme Corp", "Tech", "biz@acme.com", "1234567890", "acme.com", adminUser);
        company.setId(100L);

        when(userRepository.findById(10L)).thenReturn(Optional.of(adminUser));
        when(companyRepository.findByOwnerId(10L)).thenReturn(Optional.of(company));
        when(employeeRepository.existsByEmailAndCompanyId("bob@acme.com", 100L)).thenReturn(false);

        Employee saved = new Employee(adminUser, company, "Bob", "bob@acme.com", "123", "IT", "Dev", new BigDecimal("60000"), LocalDate.now());
        saved.setId(50L);

        when(employeeRepository.save(any(Employee.class))).thenReturn(saved);

        EmployeeResponse response = employeeService.createEmployee(req, 10L);
        assertNotNull(response);
        assertEquals(100L, response.getCompanyId());
        assertEquals("Acme Corp", response.getCompanyName());
    }

    @Test
    void adminA_CannotAccessAdminB_CompanyOrEmployees() {
        User adminB = new User("Admin B", "adminb@example.com", "hash", "ADMIN");
        adminB.setId(99L);

        Company companyB = new Company("Beta Corp", "Finance", "biz@beta.com", "999", "beta.com", adminB);
        companyB.setId(200L);

        when(companyRepository.findById(200L)).thenReturn(Optional.of(companyB));

        assertThrows(ForbiddenOperationException.class, () -> companyService.getCompanyById(200L, 10L));
    }

    @Test
    void updateCompany_Success() {
        Company existing = new Company("Old Corp", "Old Ind", "old@corp.com", "111", "old.com", adminUser);
        existing.setId(100L);

        when(companyRepository.findByOwnerId(10L)).thenReturn(Optional.of(existing));
        when(companyRepository.save(any(Company.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CompanyRequest updateReq = new CompanyRequest("Updated Corp", "FinTech", "new@corp.com", "+91 9999999999", "new.com");
        CompanyResponse response = companyService.updateMyCompany(updateReq, 10L, "ADMIN");

        assertNotNull(response);
        assertEquals("Updated Corp", response.getCompanyName());
        assertEquals("FinTech", response.getIndustry());
        assertEquals("new@corp.com", response.getBusinessEmail());
        assertEquals("+91 9999999999", response.getContactPhone());
        assertEquals("new.com", response.getWebsite());
    }

    @Test
    void updateCompany_NonAdmin_ThrowsForbidden() {
        CompanyRequest updateReq = new CompanyRequest("Updated Corp", "FinTech", "new@corp.com", "+91 9999999999", "new.com");
        assertThrows(ForbiddenOperationException.class, () -> companyService.updateMyCompany(updateReq, 20L, "USER"));
    }
}

