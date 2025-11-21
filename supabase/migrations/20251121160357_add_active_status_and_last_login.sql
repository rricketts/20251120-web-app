/*
  # Add active status and last login tracking

  1. Changes
    - Add `is_active` column to users table (boolean, default true)
    - Add `last_login_at` column to users table (timestamp with timezone)
    - Update existing users to be active by default

  2. Purpose
    - Track whether a user account is active or disabled
    - Record the last time a user logged in
    - Admins and managers can activate/deactivate user accounts
*/

-- Add is_active column with default value of true
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Add last_login_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_login_at timestamptz;
  END IF;
END $$;

-- Update existing users to be active
UPDATE users SET is_active = true WHERE is_active IS NULL;