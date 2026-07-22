package com.vcet.hallreservation.service;

import com.vcet.hallreservation.repository.OtpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * OTP Service — generates secure 6-digit OTPs.
 *
 * Uses SecureRandom (cryptographically secure) instead of Math.random()
 * to prevent predictable OTP generation attacks.
 *
 * Also runs a scheduled cleanup every hour to delete expired OTP records.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private static final SecureRandom secureRandom = new SecureRandom();
    private final OtpRepository otpRepository;

    /**
     * Generate a cryptographically secure 6-digit OTP string.
     * Padded with leading zeros if needed (e.g., "004321").
     */
    public String generateOtp() {
        int otp = secureRandom.nextInt(900000) + 100000; // Always 6 digits: 100000–999999
        return String.valueOf(otp);
    }

    /**
     * Scheduled task: Delete all expired, unverified OTPs every hour.
     * Keeps the database clean and prevents table bloat.
     */
    @Scheduled(fixedRate = 3600000) // Every 1 hour
    @Transactional
    public void cleanupExpiredOtps() {
        otpRepository.deleteAllExpiredOtps(LocalDateTime.now());
        log.debug("Expired OTP records cleaned up.");
    }
}
