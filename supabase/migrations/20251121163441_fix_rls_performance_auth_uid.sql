/*
  # Fix RLS Performance Issues

  1. Changes
    - Replace all `auth.uid()` calls with `(select auth.uid())` in RLS policies
    - This prevents the function from being re-evaluated for each row
    - Significantly improves query performance at scale

  2. Tables affected
    - projects (4 policies)
    - project_members (2 policies)
    - users (1 policy)
    - keywords (5 policies)
    - competitors (5 policies)
    - backlinks (5 policies)
*/

-- ============================================================================
-- USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "update_own" ON users;

CREATE POLICY "update_own"
  ON users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Managers can view their owned projects" ON projects;
DROP POLICY IF EXISTS "Managers can create projects they own" ON projects;
DROP POLICY IF EXISTS "Managers can update their owned projects" ON projects;
DROP POLICY IF EXISTS "Managers can delete their owned projects" ON projects;

CREATE POLICY "Managers can view their owned projects"
  ON projects FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = (select auth.uid())) = 'manager'
    AND owner_id = (select auth.uid())
  );

CREATE POLICY "Managers can create projects they own"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM users WHERE id = (select auth.uid())) = 'manager'
    AND owner_id = (select auth.uid())
  );

CREATE POLICY "Managers can update their owned projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = (select auth.uid())) = 'manager'
    AND owner_id = (select auth.uid())
  )
  WITH CHECK (
    (SELECT role FROM users WHERE id = (select auth.uid())) = 'manager'
    AND owner_id = (select auth.uid())
  );

CREATE POLICY "Managers can delete their owned projects"
  ON projects FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM users WHERE id = (select auth.uid())) = 'manager'
    AND owner_id = (select auth.uid())
  );

-- ============================================================================
-- PROJECT_MEMBERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own memberships" ON project_members;
DROP POLICY IF EXISTS "Users can remove themselves from projects" ON project_members;

CREATE POLICY "Users can view their own memberships"
  ON project_members FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can remove themselves from projects"
  ON project_members FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- ============================================================================
-- KEYWORDS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view keywords in their projects" ON keywords;
DROP POLICY IF EXISTS "Admins can view all keywords" ON keywords;
DROP POLICY IF EXISTS "Users can insert keywords in their projects" ON keywords;
DROP POLICY IF EXISTS "Users can update keywords in their projects" ON keywords;
DROP POLICY IF EXISTS "Users can delete keywords in their projects" ON keywords;

CREATE POLICY "Users can view keywords in their projects"
  ON keywords FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = keywords.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can view all keywords"
  ON keywords FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE id = (select auth.uid())) = 'admin');

CREATE POLICY "Users can insert keywords in their projects"
  ON keywords FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = keywords.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update keywords in their projects"
  ON keywords FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = keywords.project_id
      AND project_members.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = keywords.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete keywords in their projects"
  ON keywords FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = keywords.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- COMPETITORS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view competitors in their projects" ON competitors;
DROP POLICY IF EXISTS "Admins can view all competitors" ON competitors;
DROP POLICY IF EXISTS "Users can insert competitors in their projects" ON competitors;
DROP POLICY IF EXISTS "Users can update competitors in their projects" ON competitors;
DROP POLICY IF EXISTS "Users can delete competitors in their projects" ON competitors;

CREATE POLICY "Users can view competitors in their projects"
  ON competitors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = competitors.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can view all competitors"
  ON competitors FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE id = (select auth.uid())) = 'admin');

CREATE POLICY "Users can insert competitors in their projects"
  ON competitors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = competitors.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update competitors in their projects"
  ON competitors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = competitors.project_id
      AND project_members.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = competitors.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete competitors in their projects"
  ON competitors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = competitors.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- BACKLINKS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view backlinks in their projects" ON backlinks;
DROP POLICY IF EXISTS "Admins can view all backlinks" ON backlinks;
DROP POLICY IF EXISTS "Users can insert backlinks in their projects" ON backlinks;
DROP POLICY IF EXISTS "Users can update backlinks in their projects" ON backlinks;
DROP POLICY IF EXISTS "Users can delete backlinks in their projects" ON backlinks;

CREATE POLICY "Users can view backlinks in their projects"
  ON backlinks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = backlinks.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can view all backlinks"
  ON backlinks FOR SELECT
  TO authenticated
  USING ((SELECT role FROM users WHERE id = (select auth.uid())) = 'admin');

CREATE POLICY "Users can insert backlinks in their projects"
  ON backlinks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = backlinks.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update backlinks in their projects"
  ON backlinks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = backlinks.project_id
      AND project_members.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = backlinks.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete backlinks in their projects"
  ON backlinks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = backlinks.project_id
      AND project_members.user_id = (select auth.uid())
    )
  );