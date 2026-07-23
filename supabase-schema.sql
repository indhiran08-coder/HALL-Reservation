-- =============================================================
-- VCET Hall Reservation System — Supabase Schema Setup
-- Run this in Supabase → SQL Editor → New Query → Run
-- =============================================================

-- STEP 0: Drop old tables (safe even if they don't exist)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS otp_verifications CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS halls CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =============================================================
-- STEP 1: CREATE TABLES
-- =============================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  department TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'STAFF',
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE halls (
  id BIGSERIAL PRIMARY KEY,
  hall_name TEXT NOT NULL,
  location TEXT DEFAULT '',
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  hall_id BIGINT REFERENCES halls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  purpose TEXT DEFAULT '',
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'APPROVED',
  booked_by_name TEXT DEFAULT '',
  hall_name TEXT DEFAULT '',
  hall_location TEXT DEFAULT '',
  department TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- STEP 2: ROW LEVEL SECURITY
-- =============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE halls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "halls_select" ON halls FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "halls_insert" ON halls FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "halls_update" ON halls FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "halls_delete" ON halls FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_select" ON bookings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "bookings_insert" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_update" ON bookings FOR UPDATE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "bookings_delete" ON bookings FOR DELETE USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
);

-- =============================================================
-- STEP 3: SEED — VCET Halls (5 halls, no capacity)
-- =============================================================
INSERT INTO halls (hall_name, location, description, is_active) VALUES
  ('Board Room',      'Ground Floor', 'Board room for meetings and discussions',    TRUE),
  ('Mini Board Room', 'Ground Floor', 'Small meeting room for intimate discussions', TRUE),
  ('SDC Hall',        'Ground Floor', 'Skill Development Centre Hall',              TRUE),
  ('Conference Hall', 'Second Floor', 'Conference hall for seminars and events',    TRUE),
  ('Quantum Theatre', 'Fifth Floor',  'Quantum theatre for large-scale events',     TRUE);

-- =============================================================
-- STEP 4: After creating admin in Auth > Users, run this:
-- (Replace UUID with the actual admin user ID)
-- =============================================================
-- INSERT INTO profiles (id, full_name, email, department, role)
-- VALUES (
--   'PASTE-ADMIN-UUID-HERE',
--   'System Administrator',
--   'admin@velalarengg.ac.in',
--   'Administration',
--   'ADMIN'
-- );
