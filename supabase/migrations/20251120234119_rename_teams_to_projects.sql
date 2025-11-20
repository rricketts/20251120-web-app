/*
  # Rename Teams to Projects

  ## Overview
  This migration renames the teams-related tables and columns to projects, as projects
  represent domain names in the system.

  ## Changes
  1. Rename `teams` table to `projects`
  2. Rename `team_members` table to `project_members`
  3. Update all foreign key references
  4. Rename column `team_id` to `project_id` in project_members table
  5. Drop and recreate all RLS policies with new names
  6. Update indexes with new names
  7. Update trigger function name

  ## Tables Affected
  - `teams` → `projects`
  - `team_members` → `project_members`

  ## Security
  All existing RLS policies are maintained with updated table/column references
*/

-- Rename teams table to projects
ALTER TABLE IF EXISTS teams RENAME TO projects;

-- Rename team_members table to project_members
ALTER TABLE IF EXISTS team_members RENAME TO project_members;

-- Rename the team_id column to project_id in project_members
ALTER TABLE IF EXISTS project_members RENAME COLUMN team_id TO project_id;

-- Rename indexes
DROP INDEX IF EXISTS idx_teams_owner_id;
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);

DROP INDEX IF EXISTS idx_team_members_team_id;
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);

DROP INDEX IF EXISTS idx_team_members_user_id;
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- Drop old policies from projects table
DROP POLICY IF EXISTS "Users can view teams they are members of" ON projects;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON projects;
DROP POLICY IF EXISTS "Team owners can update teams" ON projects;
DROP POLICY IF EXISTS "Team owners can delete teams" ON projects;

-- Create new policies for projects table
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Project owners can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Drop old policies from project_members table
DROP POLICY IF EXISTS "Users can view team members" ON project_members;
DROP POLICY IF EXISTS "Team owners can add members" ON project_members;
DROP POLICY IF EXISTS "Team owners can update members" ON project_members;
DROP POLICY IF EXISTS "Users and team owners can remove members" ON project_members;

-- Create new policies for project_members table
CREATE POLICY "Users can view project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
    OR (
      role = 'owner'
      AND user_id = auth.uid()
    )
  );

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

CREATE POLICY "Users and project owners can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Rename trigger function
DROP TRIGGER IF EXISTS update_teams_updated_at_trigger ON projects;
DROP FUNCTION IF EXISTS update_teams_updated_at();

CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at_trigger
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();
