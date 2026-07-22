package com.vcet.hallreservation.repository;

import com.vcet.hallreservation.entity.Booking;
import com.vcet.hallreservation.entity.Hall;
import com.vcet.hallreservation.entity.Staff;
import com.vcet.hallreservation.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Repository for Booking entity.
 *
 * The conflict detection query checks: for a given hall and date,
 * does any existing CONFIRMED booking overlap with (newStart, newEnd)?
 *
 * Two time ranges [A,B] and [C,D] overlap when: A < D AND C < B
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Conflict detection query.
     * Returns true if any CONFIRMED booking for the same hall/date overlaps the requested time.
     * Excludes a specific booking ID (used during edit to exclude self).
     */
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.hall = :hall " +
           "AND b.bookingDate = :date " +
           "AND b.status = com.vcet.hallreservation.enums.BookingStatus.CONFIRMED " +
           "AND b.id <> :excludeId " +
           "AND b.startTime < :endTime " +
           "AND b.endTime > :startTime")
    boolean hasConflict(@Param("hall") Hall hall,
                        @Param("date") LocalDate date,
                        @Param("startTime") LocalTime startTime,
                        @Param("endTime") LocalTime endTime,
                        @Param("excludeId") Long excludeId);

    /**
     * All bookings for a specific staff member ordered by date descending.
     */
    List<Booking> findByStaffOrderByBookingDateDescStartTimeDesc(Staff staff);

    /**
     * All CONFIRMED bookings for a specific date (used for daily view & dashboard).
     */
    @Query("SELECT b FROM Booking b WHERE b.bookingDate = :date AND b.status = 'CONFIRMED' ORDER BY b.startTime")
    List<Booking> findConfirmedBookingsByDate(@Param("date") LocalDate date);

    /**
     * All CONFIRMED bookings for a date range (used for weekly/monthly calendar view).
     */
    @Query("SELECT b FROM Booking b WHERE b.bookingDate BETWEEN :startDate AND :endDate " +
           "AND b.status = 'CONFIRMED' ORDER BY b.bookingDate, b.startTime")
    List<Booking> findConfirmedBookingsBetweenDates(@Param("startDate") LocalDate startDate,
                                                     @Param("endDate") LocalDate endDate);

    /**
     * Bookings for a specific hall on a specific date.
     */
    @Query("SELECT b FROM Booking b WHERE b.hall = :hall AND b.bookingDate = :date " +
           "AND b.status = 'CONFIRMED' ORDER BY b.startTime")
    List<Booking> findByHallAndDate(@Param("hall") Hall hall, @Param("date") LocalDate date);

    /**
     * Today's upcoming events (after current time).
     */
    @Query("SELECT b FROM Booking b WHERE b.bookingDate = :today AND b.status = 'CONFIRMED' " +
           "AND b.startTime >= :now ORDER BY b.startTime")
    List<Booking> findTodayUpcomingEvents(@Param("today") LocalDate today,
                                          @Param("now") LocalTime now);

    /**
     * Find all halls booked during a specific time slot (used for smart hall suggestions).
     */
    @Query("SELECT b.hall FROM Booking b WHERE b.bookingDate = :date " +
           "AND b.status = 'CONFIRMED' " +
           "AND b.startTime < :endTime AND b.endTime > :startTime")
    List<Hall> findBookedHallsForSlot(@Param("date") LocalDate date,
                                       @Param("startTime") LocalTime startTime,
                                       @Param("endTime") LocalTime endTime);

    /**
     * Count bookings per department for admin reporting.
     */
    @Query("SELECT b.department, COUNT(b) FROM Booking b WHERE b.status = 'CONFIRMED' GROUP BY b.department")
    List<Object[]> countBookingsByDepartment();
}
