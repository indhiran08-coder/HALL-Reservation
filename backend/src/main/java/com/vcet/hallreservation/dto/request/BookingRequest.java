package com.vcet.hallreservation.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

/**
 * Booking creation and update request DTO.
 * Validates all required booking fields.
 */
@Data
public class BookingRequest {

    @NotNull(message = "Hall ID is required")
    private Long hallId;

    @NotBlank(message = "Event name is required")
    @Size(max = 200, message = "Event name must not exceed 200 characters")
    private String eventName;

    @Size(max = 1000, message = "Purpose must not exceed 1000 characters")
    private String purpose;

    @NotNull(message = "Booking date is required")
    @FutureOrPresent(message = "Booking date must be today or a future date")
    private LocalDate bookingDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;
}
