/*
  # Add Super Admin Role

  1. Changes
    - Drop existing role check constraint
    - Add new check constraint including 'super_admin' role
    - Update rricketts@webmeup.app to super_admin role
  
  2. Security
    - Super Admin accounts can only be managed by other Super Admins
    - This is the highest privilege level in the system
*/

-- Drop the existing role check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new check constraint with super_admin included
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer'));

-- Update rricketts@webmeup.app to super_admin role
UPDATE users 
SET role = 'super_admin' 
WHERE email = 'rricketts@webmeup.app';
