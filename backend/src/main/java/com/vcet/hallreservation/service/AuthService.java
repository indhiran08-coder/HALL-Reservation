package com.vcet.hallreservation.service;

import com.vcet.hallreservation.dto.request.LoginRequest;
import com.vcet.hallreservation.dto.request.OtpRequest;
import com.vcet.hallreservation.dto.request.RegisterRequest;
import com.vcet.hallreservation.dto.response.AuthResponse;
import com.vcet.hallreservation.entity.OtpVerification;
import com.vcet.hallreservation.entity.Staff;
import com.vcet.hallreservation.enums.Role;
import com.vcet.hallreservation.exception.ResourceNotFoundException;
import com.vcet.hallreservation.exception.ValidationException;
import com.vcet.hallreservation.repository.OtpRepository;
import com.vcet.hallreservation.repository.StaffRepository;
import com.vcet.hallreservation.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Authentication Service — handles registration, OTP verification, and login.
 *
 * Registration flow:
 * 1. Validate email domain (@velalarengg.ac.in only)
 * 2. Check for duplicate email
 * 3. Validate password confirmation
 * 4. Hash password with BCrypt
 * 5. Save staff as unverified
 * 6. Generate 6-digit OTP and send via email
 *
 * Login flow:
 * 1. Authenticate via Spring Security (BCrypt check)
 * 2. Verify account is confirmed
 * 3. Generate JWT token
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private static final String COLLEGE_EMAIL_DOMAIN = "@velalarengg.ac.in";

    private final StaffRepository staffRepository;
    private final OtpRepository otpRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final OtpService otpService;
    private final EmailService emailService;

    @Value("${app.otp.expiry-minutes:10}")
    private int otpExpiryMinutes;

    /**
     * Register a new faculty member.
     * Validates domain, duplicates, passwords — then sends OTP.
     */
    public String register(RegisterRequest request) {
        // 1. Validate college email domain
        if (!request.getEmail().toLowerCase().endsWith(COLLEGE_EMAIL_DOMAIN)) {
            throw new ValidationException(
                "Registration is restricted to official Velalar College email addresses (@velalarengg.ac.in)."
            );
        }

        // 2. Check for duplicate email
        if (staffRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new ValidationException("This email address is already registered.");
        }

        // 3. Validate password confirmation
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new ValidationException("Passwords do not match.");
        }

        // 4. Create and save unverified staff account
        Staff staff = Staff.builder()
                .fullName(request.getFullName().trim())
                .department(request.getDepartment())
                .email(request.getEmail().toLowerCase().trim())
                .password(passwordEncoder.encode(request.getPassword()))
                .verified(false)
                .role(Role.FACULTY)
                .build();
        staffRepository.save(staff);

        // 5. Generate OTP and send email
        sendOtpToStaff(staff);

        log.info("New faculty registered: {}", staff.getEmail());
        return "Registration successful. Please verify your email with the OTP sent to " + staff.getEmail();
    }

    /**
     * Verify OTP submitted by the user.
     */
    public String verifyOtp(OtpRequest request) {
        Staff staff = staffRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email."));

        OtpVerification otpRecord = otpRepository
                .findLatestValidOtp(staff, LocalDateTime.now())
                .orElseThrow(() -> new ValidationException(
                        "OTP has expired or is invalid. Please request a new OTP."));

        if (!otpRecord.getOtp().equals(request.getOtp())) {
            throw new ValidationException("Incorrect OTP. Please try again.");
        }

        // Mark OTP and account as verified
        otpRecord.setVerified(true);
        otpRepository.save(otpRecord);

        staff.setVerified(true);
        staffRepository.save(staff);

        log.info("Email verified for: {}", staff.getEmail());
        return "Email verified successfully! You can now log in.";
    }

    /**
     * Resend a fresh OTP to the user's email.
     */
    public String resendOtp(String email) {
        Staff staff = staffRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("No account found with this email."));

        if (staff.isVerified()) {
            throw new ValidationException("This account is already verified.");
        }

        sendOtpToStaff(staff);
        return "A new OTP has been sent to " + email;
    }

    /**
     * Authenticate a verified faculty member and return a JWT token.
     */
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail().toLowerCase(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException ex) {
            throw new ValidationException("Invalid email or password.");
        }

        Staff staff = staffRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found."));

        UserDetails userDetails = userDetailsService.loadUserByUsername(staff.getEmail());
        String token = jwtService.generateToken(userDetails);

        log.info("Login successful for: {}", staff.getEmail());

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(staff.getId())
                .fullName(staff.getFullName())
                .email(staff.getEmail())
                .department(staff.getDepartment())
                .role(staff.getRole())
                .build();
    }

    /**
     * Internal method to generate OTP and send email.
     */
    private void sendOtpToStaff(Staff staff) {
        String otp = otpService.generateOtp();

        OtpVerification otpVerification = OtpVerification.builder()
                .staff(staff)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(otpExpiryMinutes))
                .verified(false)
                .build();
        otpRepository.save(otpVerification);

        emailService.sendOtpEmail(staff.getEmail(), staff.getFullName(), otp, otpExpiryMinutes);
    }
}
