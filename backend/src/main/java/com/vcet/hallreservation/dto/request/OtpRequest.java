package com.vcet.hallreservation.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * OTP verification and resend request DTO.
 */
@Data
public class OtpRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be a 6-digit number")
    private String otp;
}
