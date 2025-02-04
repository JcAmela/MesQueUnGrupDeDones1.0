/*
  # Reservation System Schema

  1. New Tables
    - `profiles`
      - Extends auth.users with additional user information
      - Contains name, phone, preferences
    - `classes`
      - Stores class information and schedules
      - Includes title, datetime, capacity limits
    - `reservations`
      - Manages bookings and their status
      - Links users to classes with status tracking
    - `waiting_list`
      - Handles overflow bookings
      - Maintains order for automatic assignment

  2. Security
    - Enable RLS on all tables
    - Add policies for:
      - Users can read available classes
      - Users can manage their own reservations
      - Admin can manage all data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  phone text,
  preferred_language text DEFAULT 'es',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  datetime timestamptz NOT NULL,
  duration interval NOT NULL,
  max_participants integer NOT NULL,
  instructor_name text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  qr_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, class_id)
);

-- Create waiting list table
CREATE TABLE IF NOT EXISTS waiting_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, class_id),
  UNIQUE(class_id, position)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Classes policies
CREATE POLICY "Anyone can view classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage classes"
  ON classes
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Reservations policies
CREATE POLICY "Users can view their reservations"
  ON reservations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reservations"
  ON reservations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reservations"
  ON reservations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reservations"
  ON reservations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Waiting list policies
CREATE POLICY "Users can view their waiting list entries"
  ON waiting_list
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join waiting list"
  ON waiting_list
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Functions
CREATE OR REPLACE FUNCTION check_reservation_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM reservations
    WHERE class_id = NEW.class_id
    AND status = 'confirmed'
  ) >= (
    SELECT max_participants
    FROM classes
    WHERE id = NEW.class_id
  ) THEN
    RAISE EXCEPTION 'Class is full';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER check_availability
  BEFORE INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION check_reservation_availability();