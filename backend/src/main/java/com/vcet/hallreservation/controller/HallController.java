package com.vcet.hallreservation.controller;

import com.vcet.hallreservation.dto.request.HallRequest;
import com.vcet.hallreservation.dto.response.ApiResponse;
import com.vcet.hallreservation.dto.response.HallResponse;
import com.vcet.hallreservation.service.HallService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * Hall Controller — endpoints for hall management and availability.
 *
 * Public endpoints:
 * GET /api/halls                     — All active halls with live availability
 * GET /api/halls/{id}                — Single hall details
 * GET /api/halls/available           — Available halls for a specific date/time slot
 *
 * Admin-only endpoints:
 * POST   /api/halls                  — Create hall
 * PUT    /api/halls/{id}             — Update hall
 * DELETE /api/halls/{id}             — Deactivate hall
 * GET    /api/halls/admin/all        — All halls including inactive
 */
@RestController
@RequestMapping("/halls")
@RequiredArgsConstructor
public class HallController {

    private final HallService hallService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<HallResponse>>> getAllHalls() {
        return ResponseEntity.ok(ApiResponse.success("Halls retrieved", hallService.getAllHalls()));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<HallResponse>>> getAllHallsForAdmin() {
        return ResponseEntity.ok(
                ApiResponse.success("All halls retrieved", hallService.getAllHallsForAdmin()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HallResponse>> getHall(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success("Hall retrieved", hallService.getHallById(id)));
    }

    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<HallResponse>>> getAvailableHalls(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        return ResponseEntity.ok(ApiResponse.success(
                "Available halls retrieved",
                hallService.getAvailableHalls(date, startTime, endTime)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HallResponse>> createHall(
            @Valid @RequestBody HallRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Hall created successfully", hallService.createHall(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<HallResponse>> updateHall(
            @PathVariable Long id,
            @Valid @RequestBody HallRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("Hall updated successfully", hallService.updateHall(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteHall(@PathVariable Long id) {
        hallService.deleteHall(id);
        return ResponseEntity.ok(ApiResponse.success("Hall deactivated successfully"));
    }
}
