package com.vcet.hallreservation.repository;

import com.vcet.hallreservation.entity.OtpVerification;
import com.vcet.hallreservation.entity.Staff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Repository for OtpVerification entity.
 * Provides queries for OTP validation, expiry checking, and cleanup.
 */
@Repository
public interface OtpRepository extends JpaRepository<OtpVerification, Long> {

    /**
     * Find the latest unverified, non-expired OTP for a staff member.
     */
    @Query("SELECT o FROM OtpVerification o WHERE o.staff = :staff AND o.verified = false " +
           "AND o.expiryTime > :now ORDER BY o.createdAt DESC LIMIT 1")
    Optional<OtpVerification> findLatestValidOtp(Staff staff, LocalDateTime now);

    /**
     * Find latest OTP by staff (regardless of expiry) — used for resend logic.
     */
    Optional<OtpVerification> findTopByStaffOrderByCreatedAtDesc(Staff staff);

    /**
     * Delete all expired and unverified OTPs — called by scheduled cleanup task.
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM OtpVerification o WHERE o.expiryTime < :now AND o.verified = false")
    void deleteAllExpiredOtps(LocalDateTime now);
}
