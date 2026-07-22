package com.vcet.hallreservation.repository;

import com.vcet.hallreservation.entity.Staff;
import com.vcet.hallreservation.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

/**
 * Repository for Staff entity.
 * Provides database access for authentication, registration, and admin operations.
 */
@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Staff> findByRole(Role role);

    List<Staff> findByDepartment(String department);
}
