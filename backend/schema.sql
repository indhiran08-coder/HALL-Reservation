-- ============================================================
-- VCET Hall Reservation System — Database Schema
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jwsngfryxtrlkhcxbjhy/sql
-- ============================================================

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    department VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'FACULTY',
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- OTP Verification Table
CREATE TABLE IF NOT EXISTS otp_verification (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(10) NOT NULL,
    expiry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hall Table
CREATE TABLE IF NOT EXISTS hall (
    id BIGSERIAL PRIMARY KEY,
    hall_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    description TEXT,
    capacity INTEGER,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Booking Table
CREATE TABLE IF NOT EXISTS booking (
    id BIGSERIAL PRIMARY KEY,
    staff_id BIGINT NOT NULL REFERENCES staff(id),
    hall_id BIGINT NOT NULL REFERENCES hall(id),
    event_name VARCHAR(255) NOT NULL,
    purpose TEXT,
    department VARCHAR(255),
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_booking_date ON booking(booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_hall_date ON booking(hall_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_booking_staff ON booking(staff_id);
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verification(email);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);

-- Seed: Admin account (password = BCrypt hash of 'Admin@1234')
INSERT INTO staff (full_name, email, password, department, role, enabled)
VALUES (
    'System Administrator',
    'admin@velalarengg.ac.in',
    '$2a$12$N.9vO0X0JdXXVmpYkTxOqe4Zzpq6DaOLGcyHcbA5/Qh0bAQOKLyOC',
    'Administration',
    'ADMIN',
    TRUE
) ON CONFLICT (email) DO NOTHING;

-- Seed: Conference Halls
INSERT INTO hall (hall_name, location, description, capacity, active) VALUES
    ('Board Room',        'Ground Floor', 'Main board room for official meetings and discussions', 30,  TRUE),
    ('Mini Board Room',   'Ground Floor', 'Smaller meeting room for departmental discussions', 15, TRUE),
    ('SDC Hall',          'Ground Floor', 'Software Development Cell hall for technical events', 60,  TRUE),
    ('Conference Hall',   'Second Floor', 'Large conference hall for seminars and workshops', 150, TRUE),
    ('Quantum Theatre',   'Fifth Floor',  'State-of-the-art theatre for presentations and events', 300, TRUE)
ON CONFLICT DO NOTHING;
