/*
  # Fix Users Table RLS Policies for Manager Permissions

  1. Changes
    - Drop all existing permissive RLS policies on users table
    - Create restrictive SELECT policy: admins see all users, managers see only users they created
    - Create restrictive INSERT policy: admins and managers can create users with proper role restrictions
    - Create restrictive UPDATE policy: admins can update all users, managers can only update users they created
    - Create restrictive DELETE policy: admins can delete all users, managers can only delete users they created

  2. Security
    - Managers can only see users where created_by = their user ID
    - Managers cannot create admin users (enforced by policy)
    - Admins have full access to all users
    - Regular users have no access to the users management table
*/

-- Drop all existing permissive policies
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow public insert to users" ON users;
DROP POLICY IF EXISTS "Allow public update to users" ON users;
DROP POLICY IF EXISTS "Allow public delete to users" ON users;

-- SELECT policy: admins see all, managers see only their created users
CREATE POLICY "Users can view based on role"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.role = 'manager' AND users.created_by = u.id)
      )
    )
  );

-- INSERT policy: admins and managers can create users, but managers cannot create admins
CREATE POLICY "Admins and managers can create users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.role = 'manager' AND users.role IN ('manager', 'user'))
      )
    )
    AND created_by = auth.uid()
  );

-- UPDATE policy: admins can update all, managers can only update their created users
CREATE POLICY "Users can update based on role"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.role = 'manager' AND users.created_by = u.id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.role = 'manager' AND users.created_by = u.id AND users.role IN ('manager', 'user'))
      )
    )
  );

-- DELETE policy: admins can delete all, managers can only delete their created users
CREATE POLICY "Users can delete based on role"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'admin'
        OR (u.role = 'manager' AND users.created_by = u.id)
      )
    )
  );
