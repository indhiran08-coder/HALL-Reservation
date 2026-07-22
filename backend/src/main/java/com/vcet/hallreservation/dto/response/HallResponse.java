package com.vcet.hallreservation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Hall response DTO returned to the client.
 * Includes booking availability status for dashboard display.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HallResponse {

    private Long id;
    private String hallName;
    private String location;
    private String description;
    private Integer capacity;
    private boolean active;
    private boolean currentlyBooked; // Used in live availability dashboard
}
