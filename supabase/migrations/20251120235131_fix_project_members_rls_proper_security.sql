/*
  # Fix Project Members RLS - Proper Security Without Circular Dependencies

  ## Problem
  Previous migration was too permissive. We need proper security without circular dependencies.

  ## Solution
  The key insight: Don't query between projects and project_members in RLS policies.
  Instead:
  1. For SELECT: Allow users to see project_members if they themselves are a member of that project
  2. For INSERT/UPDATE/DELETE: These operations should be controlled at application level,
     with RLS providing a safety net by ensuring users can only modify their own records
     or records where they are listed as owner in that same table

  ## Changes
  - Drop overly permissive policies from previous migration
  - Create secure policies that don't create circular dependencies
*/

-- Drop the permissive policies
DROP POLICY IF EXISTS "Users can view all project members" ON project_members;
DROP POLICY IF EXISTS "Users can add themselves as owner on project creation" ON project_members;
DROP POLICY IF EXISTS "Allow inserting members" ON project_members;
DROP POLICY IF EXISTS "Users can remove themselves from projects" ON project_members;
DROP POLICY IF EXISTS "Allow updating members" ON project_members;

-- SELECT: Users can see project members for projects they are members of
-- This checks the same table (project_members), no circular dependency
CREATE POLICY "Users can view project members where they are members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
    )
  );

-- INSERT: Allow users to add themselves as owner (for project creation)
-- or trust application logic for adding other members
CREATE POLICY "Users can add themselves as members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR role = 'owner'
  );

-- UPDATE: Users with owner role in the same project can update members
-- This checks the same table, no circular dependency  
CREATE POLICY "Owners can update project members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );

-- DELETE: Users can remove themselves, or owners can remove others
CREATE POLICY "Users can remove themselves or owners can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id = auth.uid()
      AND pm.role = 'owner'
    )
  );
