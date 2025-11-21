/*
  # Fix Project Members Insert Policy

  ## Changes
  1. Update the INSERT policy for project_members to allow:
     - Users to add themselves as members when they own the project
     - Project owners to add other members

  ## Security
  - Maintains proper access control
  - Only allows legitimate member additions
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can add themselves as members" ON project_members;

-- Create new insert policy that allows project owners to add members
CREATE POLICY "Project owners can add members"
  ON project_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if user is adding themselves
    (user_id = auth.uid())
    OR
    -- Allow if user is the owner of the project
    (EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    ))
  );
