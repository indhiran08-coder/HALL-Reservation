package com.vcet.hallreservation.controller;

import com.vcet.hallreservation.dto.request.LoginRequest;
import com.vcet.hallreservation.dto.request.OtpRequest;
import com.vcet.hallreservation.dto.request.RegisterRequest;
import com.vcet.hallreservation.dto.response.ApiResponse;
import com.vcet.hallreservation.dto.response.AuthResponse;
import com.vcet.hallreservation.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Auth Controller — handles all public authentication endpoints.
 *
 * Endpoints:
 * POST /api/auth/register       — Register a new faculty member
 * POST /api/auth/verify-otp     — Verify email with OTP
 * POST /api/auth/resend-otp     — Resend OTP
 * POST /api/auth/login          — Login and get JWT
 */
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<String>> register(
            @Valid @RequestBody RegisterRequest request) {
        String message = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(message, request.getEmail()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<String>> verifyOtp(
            @Valid @RequestBody OtpRequest request) {
        String message = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<String>> resendOtp(
            @RequestParam String email) {
        String message = authService.resendOtp(email);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}
