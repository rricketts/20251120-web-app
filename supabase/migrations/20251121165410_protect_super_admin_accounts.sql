/*
  # Protect Super Admin Accounts with RLS

  1. Changes
    - Update RLS policies to prevent non-Super Admins from editing/deleting Super Admin accounts
    - Only Super Admins can manage Super Admin accounts
  
  2. Security
    - Adds additional check in update and delete policies
    - Ensures Super Admin accounts are protected at the database level
*/

-- Drop existing policies that need to be updated
DROP POLICY IF EXISTS "Admins and managers can update users they manage" ON users;
DROP POLICY IF EXISTS "Admins and managers can delete users they manage" ON users;

-- Recreate update policy with Super Admin protection
CREATE POLICY "Admins and managers can update users they manage"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        (u.role = 'super_admin') OR
        (u.role = 'admin' AND users.role != 'super_admin') OR
        (u.role = 'manager' AND users.created_by = u.id AND users.role != 'super_admin' AND users.role != 'admin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        (u.role = 'super_admin') OR
        (u.role = 'admin' AND users.role != 'super_admin') OR
        (u.role = 'manager' AND users.created_by = u.id AND users.role != 'super_admin' AND users.role != 'admin')
      )
    )
  );

-- Recreate delete policy with Super Admin protection
CREATE POLICY "Admins and managers can delete users they manage"
  ON users FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        (u.role = 'super_admin') OR
        (u.role = 'admin' AND users.role != 'super_admin') OR
        (u.role = 'manager' AND users.created_by = u.id AND users.role != 'super_admin' AND users.role != 'admin')
      )
    )
  );
