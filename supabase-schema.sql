-- =============================================================
-- VCET Hall Reservation System — Supabase Schema Setup
-- Run this entire script in Supabase → SQL Editor → New Query
-- =============================================================

-- 1. PROFILES TABLE (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  department TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'STAFF',  -- 'STAFF' or 'ADMIN'
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HALLS TABLE
CREATE TABLE IF NOT EXISTS halls (
  id BIGSERIAL PRIMARY KEY,
  hall_name TEXT NOT NULL,
  location TEXT DEFAULT '',
  capacity INTEGER DEFAULT 0,
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
  id BIGSERIAL PRIMARY KEY,
  hall_id BIGINT REFERENCES halls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  purpose TEXT DEFAULT '',
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT DEFAULT 'APPROVED',       -- 'APPROVED' | 'CANCELLED'
  booked_by_name TEXT DEFAULT '',
  hall_name TEXT DEFAULT '',            -- denormalized for fast display
  hall_location TEXT DEFAULT '',
  department TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

-- Profiles: authenticated users can read all, insert/update own row
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles viewable by auth users" ON profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users update own profile" ON profiles;

CREATE POLICY "Profiles viewable by auth users"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Halls: all authenticated can read; only ADMIN can write
ALTER TABLE halls ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Halls viewable" ON halls;
DROP POLICY IF EXISTS "Admin insert hall" ON halls;
DROP POLICY IF EXISTS "Admin update hall" ON halls;
DROP POLICY IF EXISTS "Admin delete hall" ON halls;

CREATE POLICY "Halls viewable"
  ON halls FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admin insert hall"
  ON halls FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Admin update hall"
  ON halls FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Admin delete hall"
  ON halls FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Bookings: all authenticated can read; own bookings can write; admin can write all
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Bookings viewable" ON bookings;
DROP POLICY IF EXISTS "Users create bookings" ON bookings;
DROP POLICY IF EXISTS "Users update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users delete own bookings" ON bookings;

CREATE POLICY "Bookings viewable"
  ON bookings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users create bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own bookings"
  ON bookings FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Users delete own bookings"
  ON bookings FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- =============================================================
-- SEED: Default Halls
-- =============================================================
INSERT INTO halls (hall_name, location, capacity, description, is_active) VALUES
  ('Board Room',       'Ground Floor',  20,  'Board room for meetings and discussions',      TRUE),
  ('Mini Board Room',  'Ground Floor',  10,  'Small meeting room for intimate discussions',   TRUE),
  ('SDC Hall',         'Ground Floor', 100,  'Skill Development Centre Hall',                TRUE),
  ('Seminar Hall 1',   'Second Floor', 150,  'Large seminar hall for presentations',         TRUE),
  ('Seminar Hall 2',   'Second Floor', 150,  'Large seminar hall for presentations',         TRUE),
  ('Seminar Hall 3',   'Second Floor', 150,  'Large seminar hall for presentations',         TRUE),
  ('Seminar Hall 4',   'Second Floor', 100,  'Medium seminar hall',                          TRUE),
  ('Smart Class 1',    'Second Floor',  60,  'Smart classroom with modern facilities',       TRUE),
  ('Smart Class 2',    'Second Floor',  60,  'Smart classroom with modern facilities',       TRUE),
  ('Smart Class 3',    'Second Floor',  60,  'Smart classroom with modern facilities',       TRUE),
  ('Smart Class 4',    'Second Floor',  60,  'Smart classroom with modern facilities',       TRUE)
ON CONFLICT DO NOTHING;

-- =============================================================
-- ADMIN SETUP (Run AFTER creating admin in Supabase Auth dashboard)
-- Replace the UUID below with the actual admin user ID from Auth > Users
-- =============================================================
-- INSERT INTO profiles (id, full_name, email, department, role)
-- VALUES (
--   'PASTE-ADMIN-UUID-HERE',
--   'System Administrator',
--   'admin@velalarengg.ac.in',
--   'Administration',
--   'ADMIN'
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'ADMIN';
