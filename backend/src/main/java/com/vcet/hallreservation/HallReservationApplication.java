package com.vcet.hallreservation;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Smart Conference Hall Reservation & Scheduling System
 * Velalar College of Engineering and Technology (VCET)
 *
 * Main application entry point.
 * @EnableScheduling enables OTP expiry cleanup and other scheduled tasks.
 */
@SpringBootApplication
@EnableScheduling
public class HallReservationApplication {

    public static void main(String[] args) {
        SpringApplication.run(HallReservationApplication.class, args);
    }
}
