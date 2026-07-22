package com.vcet.hallreservation.repository;

import com.vcet.hallreservation.entity.Hall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Hall entity.
 */
@Repository
public interface HallRepository extends JpaRepository<Hall, Long> {

    List<Hall> findByActiveTrue();

    boolean existsByHallNameIgnoreCase(String hallName);
}
