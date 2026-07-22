package com.vcet.hallreservation.service;

import com.vcet.hallreservation.dto.request.BookingRequest;
import com.vcet.hallreservation.dto.response.BookingResponse;
import com.vcet.hallreservation.dto.response.HallResponse;
import com.vcet.hallreservation.entity.Booking;
import com.vcet.hallreservation.entity.Hall;
import com.vcet.hallreservation.entity.Staff;
import com.vcet.hallreservation.enums.BookingStatus;
import com.vcet.hallreservation.exception.BookingConflictException;
import com.vcet.hallreservation.exception.ResourceNotFoundException;
import com.vcet.hallreservation.exception.ValidationException;
import com.vcet.hallreservation.repository.BookingRepository;
import com.vcet.hallreservation.repository.HallRepository;
import com.vcet.hallreservation.repository.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Booking Service — the core of the reservation system.
 *
 * Handles:
 * - Creating bookings with atomic conflict detection
 * - Editing bookings (only by owner)
 * - Cancelling bookings (only by owner)
 * - Calendar queries (daily, weekly, monthly views)
 * - Dashboard data (today's events, upcoming events)
 * - Smart hall suggestions when a conflict is detected
 *
 * Business Rules:
 * - Booking time window: 08:00 – 20:00
 * - Start time must be before end time
 * - Bookings only for future/today dates
 * - No overlapping bookings for the same hall (checked via DB query)
 * - Slot locked immediately upon creation (no approval flow)
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class BookingService {

    private static final LocalTime BOOKING_START_LIMIT = LocalTime.of(8, 0);
    private static final LocalTime BOOKING_END_LIMIT   = LocalTime.of(20, 0);

    private final BookingRepository bookingRepository;
    private final HallRepository hallRepository;
    private final StaffRepository staffRepository;
    private final HallService hallService;
    private final EmailService emailService;

    /**
     * Create a new booking for a faculty member.
     * Validates time window, detects conflicts, locks slot, sends confirmation email.
     */
    public BookingResponse createBooking(String staffEmail, BookingRequest request) {
        Staff staff = getStaffByEmail(staffEmail);
        Hall hall = getHallById(request.getHallId());

        // Validate booking time constraints
        validateBookingTimes(request.getBookingDate(), request.getStartTime(), request.getEndTime());

        // Conflict detection — atomic check before insert
        boolean conflict = bookingRepository.hasConflict(
                hall, request.getBookingDate(),
                request.getStartTime(), request.getEndTime(),
                -1L // No booking to exclude on creation
        );

        if (conflict) {
            List<HallResponse> suggestions = hallService.getAvailableHalls(
                    request.getBookingDate(), request.getStartTime(), request.getEndTime());
            throw new BookingConflictException(
                    "Hall is already booked during the selected time.", suggestions);
        }

        Booking booking = Booking.builder()
                .staff(staff)
                .hall(hall)
                .department(staff.getDepartment())
                .eventName(request.getEventName().trim())
                .purpose(request.getPurpose())
                .bookingDate(request.getBookingDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(BookingStatus.CONFIRMED)
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created: {} by {} for {} on {}",
                saved.getId(), staffEmail, hall.getHallName(), request.getBookingDate());

        // Send confirmation email asynchronously
        emailService.sendBookingConfirmationEmail(
                staff.getEmail(), staff.getFullName(),
                hall.getHallName(), hall.getLocation(),
                saved.getEventName(), saved.getDepartment(),
                saved.getBookingDate(), saved.getStartTime(), saved.getEndTime()
        );

        return mapToResponse(saved);
    }

    /**
     * Update an existing booking (owner only).
     */
    public BookingResponse updateBooking(String staffEmail, Long bookingId, BookingRequest request) {
        Staff staff = getStaffByEmail(staffEmail);
        Booking booking = getBookingById(bookingId);

        // Ownership check
        if (!booking.getStaff().getId().equals(staff.getId())) {
            throw new ValidationException("You can only edit your own bookings.");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ValidationException("Cancelled bookings cannot be modified.");
        }

        Hall hall = getHallById(request.getHallId());
        validateBookingTimes(request.getBookingDate(), request.getStartTime(), request.getEndTime());

        // Conflict detection, excluding the current booking
        boolean conflict = bookingRepository.hasConflict(
                hall, request.getBookingDate(),
                request.getStartTime(), request.getEndTime(),
                bookingId
        );

        if (conflict) {
            List<HallResponse> suggestions = hallService.getAvailableHalls(
                    request.getBookingDate(), request.getStartTime(), request.getEndTime());
            throw new BookingConflictException(
                    "Hall is already booked during the selected time.", suggestions);
        }

        booking.setHall(hall);
        booking.setEventName(request.getEventName().trim());
        booking.setPurpose(request.getPurpose());
        booking.setBookingDate(request.getBookingDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());

        Booking saved = bookingRepository.save(booking);
        log.info("Booking updated: {} by {}", bookingId, staffEmail);

        emailService.sendBookingUpdatedEmail(
                staff.getEmail(), staff.getFullName(),
                hall.getHallName(), hall.getLocation(),
                saved.getEventName(), saved.getDepartment(),
                saved.getBookingDate(), saved.getStartTime(), saved.getEndTime()
        );

        return mapToResponse(saved);
    }

    /**
     * Cancel a booking (owner only).
     */
    public void cancelBooking(String staffEmail, Long bookingId) {
        Staff staff = getStaffByEmail(staffEmail);
        Booking booking = getBookingById(bookingId);

        if (!booking.getStaff().getId().equals(staff.getId())) {
            throw new ValidationException("You can only cancel your own bookings.");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new ValidationException("This booking is already cancelled.");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
        log.info("Booking cancelled: {} by {}", bookingId, staffEmail);

        emailService.sendBookingCancelledEmail(
                staff.getEmail(), staff.getFullName(),
                booking.getHall().getHallName(), booking.getEventName(),
                booking.getBookingDate(), booking.getStartTime(), booking.getEndTime()
        );
    }

    /**
     * Get all bookings for the authenticated faculty member (My Bookings).
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String staffEmail) {
        Staff staff = getStaffByEmail(staffEmail);
        return bookingRepository.findByStaffOrderByBookingDateDescStartTimeDesc(staff)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get all confirmed bookings for a specific date (calendar daily view).
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByDate(LocalDate date) {
        return bookingRepository.findConfirmedBookingsByDate(date)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get all confirmed bookings in a date range (weekly/monthly calendar view).
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByDateRange(LocalDate startDate, LocalDate endDate) {
        return bookingRepository.findConfirmedBookingsBetweenDates(startDate, endDate)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get today's upcoming events (for dashboard widget).
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getTodayUpcomingEvents() {
        return bookingRepository.findTodayUpcomingEvents(LocalDate.now(), LocalTime.now())
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get all bookings (Admin view).
     */
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get a single booking by ID.
     */
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(String staffEmail, Long bookingId) {
        Booking booking = getBookingById(bookingId);
        return mapToResponse(booking);
    }

    // ─── Private Helpers ────────────────────────────────────────────────────────

    private void validateBookingTimes(LocalDate date, LocalTime startTime, LocalTime endTime) {
        if (date.isBefore(LocalDate.now())) {
            throw new ValidationException("Booking date must be today or a future date.");
        }
        if (!startTime.isBefore(endTime)) {
            throw new ValidationException("Start time must be before end time.");
        }
        if (startTime.isBefore(BOOKING_START_LIMIT)) {
            throw new ValidationException("Bookings are only allowed from 8:00 AM.");
        }
        if (endTime.isAfter(BOOKING_END_LIMIT)) {
            throw new ValidationException("Bookings must end by 8:00 PM.");
        }
    }

    private Staff getStaffByEmail(String email) {
        return staffRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Staff member not found."));
    }

    private Hall getHallById(Long id) {
        return hallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hall not found with id: " + id));
    }

    private Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    // ─── Mapper ────────────────────────────────────────────────────────────────

    private BookingResponse mapToResponse(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .staffId(booking.getStaff().getId())
                .bookedByName(booking.getStaff().getFullName())
                .bookedByEmail(booking.getStaff().getEmail())
                .hallId(booking.getHall().getId())
                .hallName(booking.getHall().getHallName())
                .hallLocation(booking.getHall().getLocation())
                .department(booking.getDepartment())
                .eventName(booking.getEventName())
                .purpose(booking.getPurpose())
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .status(booking.getStatus())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }
}
