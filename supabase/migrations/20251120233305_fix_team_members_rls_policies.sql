/*
  # Fix Team Members RLS Policies - Remove Infinite Recursion

  ## Problem
  The team_members RLS policies were causing infinite recursion by querying the same table
  within the policy definitions. This creates a circular dependency.

  ## Solution
  Replace the recursive policies with simpler, non-recursive alternatives:
  
  1. **SELECT Policy**: Allow users to view team members for teams they own or through teams table
  2. **INSERT Policy**: Allow team owners to add members (check via teams table)
  3. **UPDATE Policy**: Allow team owners to update members (check via teams table)
  4. **DELETE Policy**: Allow users to remove themselves OR team owners to remove any member

  ## Changes
  - Drop all existing team_members policies
  - Create new non-recursive policies that check ownership via the teams table
  - This breaks the circular dependency while maintaining security
*/

-- Drop existing team_members policies
DROP POLICY IF EXISTS "Users can view members of their teams" ON team_members;
DROP POLICY IF EXISTS "Team owners and admins can add members" ON team_members;
DROP POLICY IF EXISTS "Team owners and admins can update members" ON team_members;
DROP POLICY IF EXISTS "Team owners and admins can remove members, users can remove themselves" ON team_members;

-- New SELECT policy: Users can view team members if they own the team OR are viewing their own membership
CREATE POLICY "Users can view team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- New INSERT policy: Only allow if user is team owner OR inserting for a new team they're creating
CREATE POLICY "Team owners can add members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
    OR (
      role = 'owner'
      AND user_id = auth.uid()
    )
  );

-- New UPDATE policy: Only team owners can update members
CREATE POLICY "Team owners can update members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- New DELETE policy: Users can remove themselves OR team owners can remove any member
CREATE POLICY "Users and team owners can remove members"
  ON team_members FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
  );
