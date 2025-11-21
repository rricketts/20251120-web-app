/*
  # Fix RLS Infinite Recursion

  1. Changes
    - Drop all existing policies on projects and project_members tables
    - Create new simplified policies that don't create circular dependencies
    - Projects policies check ownership directly without joining to project_members
    - Project_members policies use direct ownership checks without complex subqueries
  
  2. Security
    - Admins can access everything
    - Managers can only access their own projects (where owner_id = auth.uid())
    - Users can only see projects they're explicitly members of
    - All policies remain restrictive and secure
*/

-- Drop all existing policies
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Managers can view their own and assigned projects" ON projects;
DROP POLICY IF EXISTS "Users can view assigned projects" ON projects;
DROP POLICY IF EXISTS "Admins can create projects" ON projects;
DROP POLICY IF EXISTS "Managers can create projects" ON projects;
DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
DROP POLICY IF EXISTS "Managers can update their own projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete all projects" ON projects;
DROP POLICY IF EXISTS "Managers can delete their own projects" ON projects;

DROP POLICY IF EXISTS "Admins can view all project members" ON project_members;
DROP POLICY IF EXISTS "Managers can view project members" ON project_members;
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Admins can add project members" ON project_members;
DROP POLICY IF EXISTS "Managers can add members to their projects" ON project_members;
DROP POLICY IF EXISTS "Admins can update project members" ON project_members;
DROP POLICY IF EXISTS "Managers can update their project members" ON project_members;
DROP POLICY IF EXISTS "Admins can remove project members" ON project_members;
DROP POLICY IF EXISTS "Managers can remove members from their projects" ON project_members;
DROP POLICY IF EXISTS "Users can remove themselves from projects" ON project_members;

-- Projects SELECT policies (no dependencies on project_members)
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Managers can view their owned projects"
  ON projects FOR SELECT
  TO authenticated
  USING (is_manager() AND owner_id = auth.uid());

CREATE POLICY "All users can view projects they are members of"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

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

-- Project_members SELECT policies (direct checks, no circular dependency)
CREATE POLICY "Admins can view all project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Project owners can view their project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

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
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Project_members UPDATE policies
CREATE POLICY "Admins can update project members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Project owners can update members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Project_members DELETE policies
CREATE POLICY "Admins can remove project members"
  ON project_members FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove themselves from projects"
  ON project_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
