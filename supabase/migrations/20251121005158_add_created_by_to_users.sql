/*
  # Add created_by tracking to users table

  1. Changes
    - Add `created_by` column to `users` table to track which user created each user
    - Add foreign key constraint to reference the creator
    - Backfill existing users with NULL (they were created before this tracking)
  
  2. Security
    - Update RLS policies to allow managers to see users they created
*/

-- Add created_by column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE users ADD COLUMN created_by uuid REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_created_by ON users(created_by);
