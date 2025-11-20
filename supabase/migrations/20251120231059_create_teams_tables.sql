/*
  # Create Teams Management Tables

  ## Overview
  This migration creates the necessary tables and relationships for team management functionality,
  allowing users to create teams, manage team members, and associate users with teams.

  ## New Tables
  
  ### 1. `teams`
  Main table for storing team information
    - `id` (uuid, primary key) - Unique identifier for the team
    - `name` (text) - Name of the team
    - `plan` (text) - Team plan type (Free, Pro, Enterprise)
    - `logo_url` (text, nullable) - URL to team logo image
    - `owner_id` (uuid) - Reference to the user who owns/created the team
    - `created_at` (timestamptz) - When the team was created
    - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `team_members`
  Junction table for team membership
    - `id` (uuid, primary key) - Unique identifier
    - `team_id` (uuid) - Reference to teams table
    - `user_id` (uuid) - Reference to users table
    - `role` (text) - Member role in the team (owner, admin, member)
    - `joined_at` (timestamptz) - When the user joined the team
    - Unique constraint on (team_id, user_id) to prevent duplicate memberships

  ## Security - Row Level Security (RLS)
  
  ### teams table policies:
    - SELECT: Users can view teams they are members of
    - INSERT: Authenticated users can create teams
    - UPDATE: Only team owners can update team details
    - DELETE: Only team owners can delete teams

  ### team_members table policies:
    - SELECT: Users can view members of teams they belong to
    - INSERT: Team owners and admins can add members
    - UPDATE: Team owners and admins can update member roles
    - DELETE: Team owners and admins can remove members, users can remove themselves

  ## Important Notes
  - All tables use Row Level Security for data protection
  - Foreign key constraints ensure data integrity
  - Default values are set for timestamps and plan type
  - Indexes are created for performance optimization
*/

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plan text DEFAULT 'Free' CHECK (plan IN ('Free', 'Pro', 'Enterprise')),
  logo_url text,
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_members junction table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_teams_owner_id ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Enable RLS on teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Teams policies
CREATE POLICY "Users can view teams they are members of"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update teams"
  ON teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete teams"
  ON teams FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Enable RLS on team_members table
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Team members policies
CREATE POLICY "Users can view members of their teams"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners and admins can add members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team owners and admins can update members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team owners and admins can remove members, users can remove themselves"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    team_members.user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_teams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for teams table
DROP TRIGGER IF EXISTS update_teams_updated_at_trigger ON teams;
CREATE TRIGGER update_teams_updated_at_trigger
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_teams_updated_at();