package com.vcet.hallreservation.service;

import com.vcet.hallreservation.dto.request.HallRequest;
import com.vcet.hallreservation.dto.response.HallResponse;
import com.vcet.hallreservation.entity.Hall;
import com.vcet.hallreservation.exception.ResourceNotFoundException;
import com.vcet.hallreservation.exception.ValidationException;
import com.vcet.hallreservation.repository.BookingRepository;
import com.vcet.hallreservation.repository.HallRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Hall Service — manages conference hall CRUD and live availability.
 *
 * Live availability is computed by checking if any CONFIRMED booking
 * is currently in progress at this moment (current date and time).
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class HallService {

    private final HallRepository hallRepository;
    private final BookingRepository bookingRepository;

    /**
     * Get all active halls with their current availability status.
     */
    @Transactional(readOnly = true)
    public List<HallResponse> getAllHalls() {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        return hallRepository.findByActiveTrue().stream()
                .map(hall -> {
                    List<Hall> bookedHalls = bookingRepository
                            .findBookedHallsForSlot(today, now, now.plusMinutes(1));
                    boolean currentlyBooked = bookedHalls.stream()
                            .anyMatch(h -> h.getId().equals(hall.getId()));
                    return mapToResponse(hall, currentlyBooked);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get all halls (including inactive) for admin management.
     */
    @Transactional(readOnly = true)
    public List<HallResponse> getAllHallsForAdmin() {
        return hallRepository.findAll().stream()
                .map(hall -> mapToResponse(hall, false))
                .collect(Collectors.toList());
    }

    /**
     * Get a single hall by ID.
     */
    @Transactional(readOnly = true)
    public HallResponse getHallById(Long id) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hall not found with id: " + id));
        return mapToResponse(hall, false);
    }

    /**
     * Create a new hall (Admin only).
     */
    public HallResponse createHall(HallRequest request) {
        if (hallRepository.existsByHallNameIgnoreCase(request.getHallName())) {
            throw new ValidationException("A hall with this name already exists.");
        }

        Hall hall = Hall.builder()
                .hallName(request.getHallName().trim())
                .location(request.getLocation().trim())
                .description(request.getDescription())
                .capacity(request.getCapacity())
                .active(true)
                .build();
        Hall saved = hallRepository.save(hall);
        log.info("New hall created: {}", saved.getHallName());
        return mapToResponse(saved, false);
    }

    /**
     * Update an existing hall (Admin only).
     */
    public HallResponse updateHall(Long id, HallRequest request) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hall not found with id: " + id));

        hall.setHallName(request.getHallName().trim());
        hall.setLocation(request.getLocation().trim());
        hall.setDescription(request.getDescription());
        hall.setCapacity(request.getCapacity());

        Hall saved = hallRepository.save(hall);
        log.info("Hall updated: {}", saved.getHallName());
        return mapToResponse(saved, false);
    }

    /**
     * Soft-delete a hall by marking it inactive (Admin only).
     * Hard deletes are avoided to preserve booking history integrity.
     */
    public void deleteHall(Long id) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hall not found with id: " + id));
        hall.setActive(false);
        hallRepository.save(hall);
        log.info("Hall deactivated: {}", hall.getHallName());
    }

    /**
     * Get halls available for a specific date and time slot.
     * Used by smart hall suggestion feature.
     */
    @Transactional(readOnly = true)
    public List<HallResponse> getAvailableHalls(LocalDate date, LocalTime startTime, LocalTime endTime) {
        List<Hall> bookedHalls = bookingRepository.findBookedHallsForSlot(date, startTime, endTime);
        List<Long> bookedHallIds = bookedHalls.stream().map(Hall::getId).toList();

        return hallRepository.findByActiveTrue().stream()
                .filter(hall -> !bookedHallIds.contains(hall.getId()))
                .map(hall -> mapToResponse(hall, false))
                .collect(Collectors.toList());
    }

    // ─── Mapper ────────────────────────────────────────────────────────────────

    public HallResponse mapToResponse(Hall hall, boolean currentlyBooked) {
        return HallResponse.builder()
                .id(hall.getId())
                .hallName(hall.getHallName())
                .location(hall.getLocation())
                .description(hall.getDescription())
                .capacity(hall.getCapacity())
                .active(hall.isActive())
                .currentlyBooked(currentlyBooked)
                .build();
    }
}
