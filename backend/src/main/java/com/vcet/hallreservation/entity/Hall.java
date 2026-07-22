package com.vcet.hallreservation.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Hall entity representing a conference hall at VCET.
 * Maps to the "halls" table in Supabase PostgreSQL.
 */
@Entity
@Table(name = "halls")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Hall {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hall_name", nullable = false, unique = true, length = 100)
    private String hallName;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
