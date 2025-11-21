/*
  # Change user role from 'user' to 'viewer'

  1. Changes
    - Drop existing check constraint on users table
    - Update existing user records with role='user' to role='viewer'
    - Add new check constraint with 'viewer' instead of 'user'
    - Update default value for role column from 'user' to 'viewer'

  2. Security
    - Maintains existing RLS policies
    - No changes to permissions structure
*/

-- Drop the existing check constraint first
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Update existing users with role='user' to role='viewer'
UPDATE users SET role = 'viewer' WHERE role = 'user';

-- Add the new check constraint with 'viewer' instead of 'user'
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['admin'::text, 'manager'::text, 'viewer'::text]));

-- Update the default value for the role column
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'viewer';
