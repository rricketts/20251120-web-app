/*
  # Fix Projects RLS Infinite Recursion

  ## Problem
  Infinite recursion detected in policy for relation "projects". The SELECT policy on projects
  checks project_members, and project_members policies check projects, creating a circular dependency.

  ## Solution
  1. Update the projects SELECT policy to allow owners to see their projects directly (owner_id check)
  2. Keep the member check as an OR condition for non-owners who are members
  3. This breaks the circular dependency for the project creation flow

  ## Changes
  - Drop and recreate the "Users can view projects they are members of" policy
  - New policy checks owner_id first (no subquery), then checks membership
*/

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view projects they are members of" ON projects;

-- Create new SELECT policy that checks ownership first
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );
