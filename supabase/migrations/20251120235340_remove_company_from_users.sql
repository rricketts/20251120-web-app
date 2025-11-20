/*
  # Remove Company Field from Users Table

  ## Changes
  1. Drop the company column from the users table

  ## Notes
  - This is a safe operation as we're only removing a column
  - Existing data in the company column will be lost
*/

-- Drop the company column from users table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'company'
  ) THEN
    ALTER TABLE users DROP COLUMN company;
  END IF;
END $$;
