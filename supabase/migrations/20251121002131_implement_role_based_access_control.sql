/*
  # Implement Role-Based Access Control

  ## Overview
  This migration implements comprehensive role-based access control (RBAC) for the application.

  ## Roles
  1. **admin** (super admin)
     - Can see, add, edit, and delete ANY project in the system
     - Full access to all project members
  
  2. **manager**
     - Can add, edit, and delete projects they created (where they are owner)
     - Can assign projects to any user
     - Can see all projects they created and projects they are assigned to
  
  3. **user**
     - Can only see projects they have been assigned to
     - Cannot add, edit, or delete projects
     - Read-only access

  ## Changes
  1. Drop all existing RLS policies on projects and project_members
  2. Create new role-based policies that enforce the above rules
  3. Create helper functions for role checks
*/

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Check if user is a manager
CREATE OR REPLACE FUNCTION public.is_manager()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'manager'
  );
END;
$$;

-- Check if user is a regular user
CREATE OR REPLACE FUNCTION public.is_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'user'
  );
END;
$$;

-- ============================================================================
-- Drop Existing Policies
-- ============================================================================

-- Drop all existing policies on projects
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can insert projects" ON projects;
DROP POLICY IF EXISTS "Admins can update all projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete all projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;
DROP POLICY IF EXISTS "Users can view projects they are members of" ON projects;

-- Drop all existing policies on project_members
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;
DROP POLICY IF EXISTS "Owners can update project members" ON project_members;
DROP POLICY IF EXISTS "Users can remove themselves or owners can remove members" ON project_members;

-- ============================================================================
-- Projects Table Policies
-- ============================================================================

-- SELECT Policies for Projects
-- Admin: Can see all projects
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (is_admin());

-- Manager: Can see projects they created OR projects they are assigned to
CREATE POLICY "Managers can view their own and assigned projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    is_manager() AND (
      owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM project_members
        WHERE project_members.project_id = projects.id
        AND project_members.user_id = auth.uid()
      )
    )
  );

-- User: Can only see projects they are assigned to
CREATE POLICY "Users can view assigned projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    is_user() AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- INSERT Policies for Projects
-- Admin: Can create any project
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Manager: Can create projects (they become the owner)
CREATE POLICY "Managers can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (is_manager() AND owner_id = auth.uid());

-- Users: Cannot create projects

-- UPDATE Policies for Projects
-- Admin: Can update any project
CREATE POLICY "Admins can update all projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Manager: Can only update projects they created
CREATE POLICY "Managers can update their own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (is_manager() AND owner_id = auth.uid())
  WITH CHECK (is_manager() AND owner_id = auth.uid());

-- Users: Cannot update projects

-- DELETE Policies for Projects
-- Admin: Can delete any project
CREATE POLICY "Admins can delete all projects"
  ON projects FOR DELETE
  TO authenticated
  USING (is_admin());

-- Manager: Can only delete projects they created
CREATE POLICY "Managers can delete their own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (is_manager() AND owner_id = auth.uid());

-- Users: Cannot delete projects

-- ============================================================================
-- Project Members Table Policies
-- ============================================================================

-- SELECT Policies for Project Members
-- Admin: Can view all project members
CREATE POLICY "Admins can view all project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (is_admin());

-- Manager: Can view members of projects they own OR projects they are assigned to
CREATE POLICY "Managers can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    is_manager() AND (
      EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = project_members.project_id
        AND projects.owner_id = auth.uid()
      )
      OR user_id = auth.uid()
    )
  );

-- User: Can view members of projects they are assigned to (via their own record)
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    is_user() AND user_id = auth.uid()
  );

-- INSERT Policies for Project Members
-- Admin: Can add any member to any project
CREATE POLICY "Admins can add project members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Manager: Can add members to projects they created
CREATE POLICY "Managers can add members to their projects"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    is_manager() AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Users: Cannot add project members

-- UPDATE Policies for Project Members
-- Admin: Can update any project member
CREATE POLICY "Admins can update project members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Manager: Can update members of projects they created
CREATE POLICY "Managers can update their project members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (
    is_manager() AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    is_manager() AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Users: Cannot update project members

-- DELETE Policies for Project Members
-- Admin: Can remove any member from any project
CREATE POLICY "Admins can remove project members"
  ON project_members FOR DELETE
  TO authenticated
  USING (is_admin());

-- Manager: Can remove members from projects they created
CREATE POLICY "Managers can remove members from their projects"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    is_manager() AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Users: Can remove themselves from projects
CREATE POLICY "Users can remove themselves from projects"
  ON project_members FOR DELETE
  TO authenticated
  USING (is_user() AND user_id = auth.uid());
