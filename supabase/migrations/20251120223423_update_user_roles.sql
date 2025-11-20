/*
  # Update User Roles System

  1. Changes
    - Update role column to use enum type with 3 specific roles
    - Add default role as 'user'
    - Update existing users to have valid roles
  
  2. New Role System
    - admin: Full access, can create all user types
    - manager: Can create managers and users only
    - user: No access to user management section
  
  3. Notes
    - Existing users will be updated to 'user' role
    - First user (test user) will be set as admin
*/

DO $$
BEGIN
  -- Drop existing role column constraints if any
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  
  -- Update the role column to use specific values
  ALTER TABLE users ALTER COLUMN role TYPE text;
  
  -- Update all existing users to have 'user' role
  UPDATE users SET role = 'user' WHERE role NOT IN ('admin', 'manager', 'user');
  
  -- Set the first user as admin (assuming it's the test user)
  UPDATE users 
  SET role = 'admin' 
  WHERE email = 'john.doe@example.com'
  OR id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);
  
  -- Add check constraint for role
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'manager', 'user'));
  
  -- Set default role for new users
  ALTER TABLE users ALTER COLUMN role SET DEFAULT 'user';
END $$;
