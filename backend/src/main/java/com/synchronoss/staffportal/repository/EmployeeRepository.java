package com.synchronoss.staffportal.repository;

import com.synchronoss.staffportal.entity.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    List<Employee> findByUserId(Long userId);
    Optional<Employee> findByIdAndUserId(Long id, Long userId);
    boolean existsByEmailAndUserId(String email, Long userId);
    boolean existsByEmailAndUserIdAndIdNot(String email, Long userId, Long id);

    List<Employee> findByCompanyId(Long companyId);
    Optional<Employee> findByIdAndCompanyId(Long id, Long companyId);
    boolean existsByEmailAndCompanyId(String email, Long companyId);
    boolean existsByEmailAndCompanyIdAndIdNot(String email, Long companyId, Long id);
}
