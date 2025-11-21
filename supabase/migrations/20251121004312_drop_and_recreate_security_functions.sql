/*
  # Drop and Recreate Security Functions

  1. Changes
    - Drop existing security functions
    - Recreate with correct signatures
    - Update all RLS policies to use these functions
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS is_project_owner(uuid);
DROP FUNCTION IF EXISTS is_project_member(uuid);

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Managers can view their owned projects" ON projects;
DROP POLICY IF EXISTS "All users can view projects they are members of" ON projects;
DROP POLICY IF EXISTS "Users can view projects they are members of" ON projects;
DROP POLICY IF EXISTS "Admins can create projects" ON projects;
DROP POLICY IF EXISTS "Managers can create projects they own" ON projects;
DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
DROP POLICY IF EXISTS "Managers can update their owned projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete all projects" ON projects;
DROP POLICY IF EXISTS "Managers can delete their owned projects" ON projects;

DROP POLICY IF EXISTS "Admins can view all project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can view their project members" ON project_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON project_members;
DROP POLICY IF EXISTS "Admins can add project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;
DROP POLICY IF EXISTS "Admins can update project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can update members" ON project_members;
DROP POLICY IF EXISTS "Admins can remove project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can remove members" ON project_members;
DROP POLICY IF EXISTS "Users can remove themselves from projects" ON project_members;

-- Create security definer function to check project ownership
CREATE OR REPLACE FUNCTION is_project_owner(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND owner_id = auth.uid()
  );
$$;

-- Create security definer function to check project membership
CREATE OR REPLACE FUNCTION is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = p_project_id
    AND user_id = auth.uid()
  );
$$;

-- Projects SELECT policies
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Managers can view their owned projects"
  ON projects FOR SELECT
  TO authenticated
  USING (is_manager() AND owner_id = auth.uid());

CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  TO authenticated
  USING (is_project_member(id));

-- Projects INSERT policies
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Managers can create projects they own"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (is_manager() AND owner_id = auth.uid());

-- Projects UPDATE policies
CREATE POLICY "Admins can update all projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Managers can update their owned projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (is_manager() AND owner_id = auth.uid())
  WITH CHECK (is_manager() AND owner_id = auth.uid());

-- Projects DELETE policies
CREATE POLICY "Admins can delete all projects"
  ON projects FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Managers can delete their owned projects"
  ON projects FOR DELETE
  TO authenticated
  USING (is_manager() AND owner_id = auth.uid());

-- Project_members SELECT policies
CREATE POLICY "Admins can view all project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Project owners can view their project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (is_project_owner(project_id));

CREATE POLICY "Users can view their own memberships"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Project_members INSERT policies
CREATE POLICY "Admins can add project members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (is_project_owner(project_id));

-- Project_members UPDATE policies
CREATE POLICY "Admins can update project members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Project owners can update members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (is_project_owner(project_id))
  WITH CHECK (is_project_owner(project_id));

-- Project_members DELETE policies
CREATE POLICY "Admins can remove project members"
  ON project_members FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (is_project_owner(project_id));

CREATE POLICY "Users can remove themselves from projects"
  ON project_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
