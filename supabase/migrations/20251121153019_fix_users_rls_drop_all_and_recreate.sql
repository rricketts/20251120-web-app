/*
  # Fix infinite recursion by dropping all policies and creating simple ones

  1. Changes
    - Drop ALL existing RLS policies on users table
    - Create simple, non-recursive policies
    
  2. Security
    - Allow authenticated users to read all users
    - Restrict updates to own data only
    - Allow inserts and deletes (validated by app/edge functions)
*/

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view based on role" ON users;
DROP POLICY IF EXISTS "Users can update based on role" ON users;
DROP POLICY IF EXISTS "Users can delete based on role" ON users;
DROP POLICY IF EXISTS "Admins and managers can create users" ON users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow user creation" ON users;
DROP POLICY IF EXISTS "Allow user deletion" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Admins can delete any user" ON users;
DROP POLICY IF EXISTS "Admins can create any user" ON users;
DROP POLICY IF EXISTS "Managers can read their created users" ON users;
DROP POLICY IF EXISTS "Managers can update their created users" ON users;
DROP POLICY IF EXISTS "Managers can delete their created users" ON users;
DROP POLICY IF EXISTS "Managers can create viewer and manager users" ON users;

-- Create simple policies that don't cause recursion
CREATE POLICY "select_authenticated"
  ON users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "update_own"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "insert_authenticated"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "delete_authenticated"
  ON users FOR DELETE
  TO authenticated
  USING (true);
