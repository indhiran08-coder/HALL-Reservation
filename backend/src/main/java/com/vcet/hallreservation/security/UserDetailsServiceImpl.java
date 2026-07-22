package com.vcet.hallreservation.security;

import com.vcet.hallreservation.entity.Staff;
import com.vcet.hallreservation.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;

/**
 * Custom UserDetailsService implementation for Spring Security.
 * Loads a Staff entity by email and wraps it in Spring Security's UserDetails.
 *
 * Only verified accounts can authenticate — unverified accounts throw an exception.
 */
@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final StaffRepository staffRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Staff staff = staffRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "Staff member not found with email: " + email));

        if (!staff.isVerified()) {
            throw new UsernameNotFoundException("Account not verified. Please verify your email first.");
        }

        Collection<? extends GrantedAuthority> authorities =
                List.of(new SimpleGrantedAuthority("ROLE_" + staff.getRole().name()));

        return User.builder()
                .username(staff.getEmail())
                .password(staff.getPassword())
                .authorities(authorities)
                .build();
    }
}
