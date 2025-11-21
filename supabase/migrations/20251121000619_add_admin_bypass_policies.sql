/*
  # Add Admin Bypass Policies

  ## Changes
  1. Add policies that allow admins to perform all operations on projects and project_members
  2. Check user role from the public.users table

  ## Security
  - Only users with role='admin' in the users table can bypass normal restrictions
  - Maintains existing policies for non-admin users
*/

-- Create a function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add admin policies for projects table
CREATE POLICY "Admins can view all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete all projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (is_admin());

-- Add admin policies for project_members table
CREATE POLICY "Admins can view all project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert project members"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all project members"
  ON project_members
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete all project members"
  ON project_members
  FOR DELETE
  TO authenticated
  USING (is_admin());
