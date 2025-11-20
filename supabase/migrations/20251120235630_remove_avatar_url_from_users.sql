/*
  # Remove Avatar URL Field from Users Table

  ## Changes
  1. Drop the avatar_url column from the users table

  ## Notes
  - This is a safe operation as we're only removing a column
  - Existing data in the avatar_url column will be lost
*/

-- Drop the avatar_url column from users table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE users DROP COLUMN avatar_url;
  END IF;
END $$;
