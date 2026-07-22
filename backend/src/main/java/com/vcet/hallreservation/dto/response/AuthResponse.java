package com.vcet.hallreservation.dto.response;

import com.vcet.hallreservation.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Authentication response DTO returned after successful login.
 * Contains the JWT token and user profile details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String tokenType = "Bearer";
    private Long id;
    private String fullName;
    private String email;
    private String department;
    private Role role;
}
