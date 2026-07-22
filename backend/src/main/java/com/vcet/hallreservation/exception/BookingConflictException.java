package com.vcet.hallreservation.exception;

import com.vcet.hallreservation.dto.response.HallResponse;
import lombok.Getter;

import java.util.List;

/**
 * Thrown when a booking conflicts with an existing reservation.
 * Includes a list of alternative available halls for smart suggestion.
 */
@Getter
public class BookingConflictException extends RuntimeException {

    private final List<HallResponse> availableHalls;

    public BookingConflictException(String message, List<HallResponse> availableHalls) {
        super(message);
        this.availableHalls = availableHalls;
    }
}
