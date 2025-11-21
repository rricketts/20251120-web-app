/*
  # Remove is_verified column from users table

  1. Changes
    - Drop `is_verified` column from users table
    - We are using `is_active` as the primary status indicator instead

  2. Reason
    - Simplification: Using `is_active` as the primary status field
    - The verified status is no longer needed as active status serves the same purpose
*/

-- Drop is_verified column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE users DROP COLUMN is_verified;
  END IF;
END $$;