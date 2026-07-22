package com.vcet.hallreservation.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

/**
 * Hall creation and update request DTO (Admin only).
 */
@Data
public class HallRequest {

    @NotBlank(message = "Hall name is required")
    @Size(max = 100, message = "Hall name must not exceed 100 characters")
    private String hallName;

    @NotBlank(message = "Location is required")
    private String location;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;
}
