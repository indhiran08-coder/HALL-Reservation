package com.vcet.hallreservation.controller;

import com.vcet.hallreservation.dto.request.BookingRequest;
import com.vcet.hallreservation.dto.response.ApiResponse;
import com.vcet.hallreservation.dto.response.BookingResponse;
import com.vcet.hallreservation.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Booking Controller — handles all booking operations.
 *
 * Authenticated endpoints (Faculty):
 * POST   /api/bookings                    — Create booking
 * PUT    /api/bookings/{id}               — Update booking (owner only)
 * DELETE /api/bookings/{id}               — Cancel booking (owner only)
 * GET    /api/bookings/my                 — My bookings
 * GET    /api/bookings/{id}               — Get single booking
 *
 * Public endpoints:
 * GET    /api/bookings/today              — Today's upcoming events
 * GET    /api/bookings/date/{date}        — Bookings for a specific date
 * GET    /api/bookings/calendar           — Bookings for a date range
 *
 * Admin-only:
 * GET    /api/bookings/all               — All bookings
 */
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody BookingRequest request) {
        BookingResponse response = bookingService.createBooking(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking confirmed successfully!", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody BookingRequest request) {
        BookingResponse response = bookingService.updateBooking(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Booking updated successfully!", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        bookingService.cancelBooking(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully."));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<BookingResponse> bookings = bookingService.getMyBookings(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Bookings retrieved", bookings));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        BookingResponse response = bookingService.getBookingById(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Booking retrieved", response));
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getTodayEvents() {
        return ResponseEntity.ok(ApiResponse.success(
                "Today's events retrieved", bookingService.getTodayUpcomingEvents()));
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getBookingsByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(
                "Bookings retrieved", bookingService.getBookingsByDate(date)));
    }

    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getBookingsForCalendar(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(ApiResponse.success(
                "Calendar bookings retrieved",
                bookingService.getBookingsByDateRange(startDate, endDate)));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        return ResponseEntity.ok(ApiResponse.success("All bookings retrieved", bookingService.getAllBookings()));
    }
}
