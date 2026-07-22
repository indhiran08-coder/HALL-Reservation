package com.vcet.hallreservation.config;

import com.vcet.hallreservation.entity.Hall;
import com.vcet.hallreservation.entity.Staff;
import com.vcet.hallreservation.enums.Role;
import com.vcet.hallreservation.repository.HallRepository;
import com.vcet.hallreservation.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Data Initializer — seeds the database on application startup.
 *
 * Seeds (only if data doesn't already exist):
 * 1. Admin account: admin@velalarengg.ac.in / Admin@1234
 * 2. Conference halls at VCET:
 *    - Board Room (Ground Floor)
 *    - Mini Board Room (Ground Floor)
 *    - SDC Hall (Ground Floor)
 *    - Conference Hall (Second Floor)
 *    - Quantum Theatre (Fifth Floor)
 *
 * Uses CommandLineRunner to run after all Spring beans are initialized.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final StaffRepository staffRepository;
    private final HallRepository hallRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedAdmin();
        seedHalls();
    }

    private void seedAdmin() {
        String adminEmail = "admin@velalarengg.ac.in";
        if (!staffRepository.existsByEmail(adminEmail)) {
            Staff admin = Staff.builder()
                    .fullName("System Administrator")
                    .department("Administration")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("Admin@1234"))
                    .verified(true)
                    .role(Role.ADMIN)
                    .build();
            staffRepository.save(admin);
            log.info("✅ Admin account created: {}", adminEmail);
        } else {
            log.info("ℹ️  Admin account already exists — skipping.");
        }
    }

    private void seedHalls() {
        if (hallRepository.count() == 0) {
            hallRepository.save(Hall.builder()
                    .hallName("Board Room")
                    .location("Ground Floor")
                    .description("A professional boardroom equipped for executive meetings and small group discussions.")
                    .capacity(20)
                    .active(true).build());

            hallRepository.save(Hall.builder()
                    .hallName("Mini Board Room")
                    .location("Ground Floor")
                    .description("Compact boardroom ideal for small team meetings and quick reviews.")
                    .capacity(10)
                    .active(true).build());

            hallRepository.save(Hall.builder()
                    .hallName("SDC Hall")
                    .location("Ground Floor")
                    .description("Skill Development Centre hall suitable for training sessions and workshops.")
                    .capacity(60)
                    .active(true).build());

            hallRepository.save(Hall.builder()
                    .hallName("Conference Hall")
                    .location("Second Floor")
                    .description("Spacious conference hall for department meetings, seminars, and guest lectures.")
                    .capacity(100)
                    .active(true).build());

            hallRepository.save(Hall.builder()
                    .hallName("Quantum Theatre")
                    .location("Fifth Floor")
                    .description("State-of-the-art auditorium-style hall for large events, symposiums, and placements.")
                    .capacity(300)
                    .active(true).build());

            log.info("✅ 5 conference halls seeded successfully.");
        } else {
            log.info("ℹ️  Halls already exist — skipping seed.");
        }
    }
}
