package com.vcet.hallreservation.dto.response;

import com.vcet.hallreservation.enums.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * Booking response DTO returned to the client.
 * Flattens related entity fields (hall name, booker name) for easy frontend consumption.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private Long id;
    private Long staffId;
    private String bookedByName;
    private String bookedByEmail;
    private Long hallId;
    private String hallName;
    private String hallLocation;
    private String department;
    private String eventName;
    private String purpose;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private BookingStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
