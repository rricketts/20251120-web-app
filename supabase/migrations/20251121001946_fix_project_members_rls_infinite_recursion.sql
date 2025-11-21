/*
  # Fix Project Members RLS Infinite Recursion

  ## Problem
  The policy "Users can view project members where they are members" creates infinite recursion
  because it queries project_members from within a project_members policy.

  ## Solution
  Simplify the RLS policies to avoid self-referencing queries:
  1. For SELECT on project_members: Use a materialized approach via security definer function
  2. Or alternatively, rely on projects table owner_id which doesn't create circular dependency
  3. Use simpler policies that don't query the same table

  ## Changes
  - Drop all existing policies on project_members
  - Create new simplified policies without circular dependencies
*/

-- Drop all existing policies on project_members
DROP POLICY IF EXISTS "Users can view project members where they are members" ON project_members;
DROP POLICY IF EXISTS "Users can add themselves as members" ON project_members;
DROP POLICY IF EXISTS "Owners can update project members" ON project_members;
DROP POLICY IF EXISTS "Users can remove themselves or owners can remove members" ON project_members;
DROP POLICY IF EXISTS "Admins can view all project members" ON project_members;
DROP POLICY IF EXISTS "Admins can insert project members" ON project_members;
DROP POLICY IF EXISTS "Admins can update all project members" ON project_members;
DROP POLICY IF EXISTS "Admins can delete all project members" ON project_members;
DROP POLICY IF EXISTS "Project owners can add members" ON project_members;

-- Create a security definer function to check project membership
CREATE OR REPLACE FUNCTION public.is_project_member(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
  );
END;
$$;

-- SELECT: Users can view project members if they check via the projects table
-- This avoids querying project_members from within project_members policy
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    -- User is owner of the project (check via projects table, not project_members)
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
    OR
    -- User is viewing their own membership record
    user_id = auth.uid()
    OR
    -- User is an admin
    is_admin()
  );

-- INSERT: Users can add themselves or project owners can add members
CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User is adding themselves as owner (project creation)
    user_id = auth.uid()
    OR
    -- User is the project owner (checked via projects table)
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
    OR
    -- User is an admin
    is_admin()
  );

-- UPDATE: Project owners can update members
CREATE POLICY "Owners can update project members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
    OR
    is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
    OR
    is_admin()
  );

-- DELETE: Users can remove themselves or owners can remove members
CREATE POLICY "Users can remove themselves or owners can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
    OR
    is_admin()
  );
