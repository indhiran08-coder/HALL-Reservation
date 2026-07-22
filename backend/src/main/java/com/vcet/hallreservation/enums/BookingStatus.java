package com.vcet.hallreservation.enums;

/**
 * Booking status values.
 * CONFIRMED  - Active, locked booking.
 * CANCELLED  - Cancelled by the booking owner.
 * COMPLETED  - Past booking (date has passed).
 */
public enum BookingStatus {
    CONFIRMED,
    CANCELLED,
    COMPLETED
}
