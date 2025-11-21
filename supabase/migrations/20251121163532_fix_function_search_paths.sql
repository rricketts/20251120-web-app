/*
  # Fix Function Search Paths

  1. Changes
    - Set search_path for all functions to be immutable
    - This prevents security vulnerabilities from search_path manipulation
    - Functions affected:
      - is_project_owner
      - is_project_member
      - is_admin
      - update_projects_updated_at

  2. Security Benefits
    - Prevents potential privilege escalation attacks
    - Ensures functions always use the expected schema
    
  3. Notes
    - Using CASCADE to drop functions that have dependent policies
    - Policies will be recreated after functions are recreated
*/

-- Drop and recreate is_project_owner with fixed search_path
DROP FUNCTION IF EXISTS is_project_owner(uuid) CASCADE;

CREATE OR REPLACE FUNCTION is_project_owner(project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects
    WHERE id = project_id
    AND owner_id = auth.uid()
  );
END;
$$;

-- Recreate dependent policies for project_members
CREATE POLICY "Project owners can view their project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (is_project_owner(project_id));

CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (is_project_owner(project_id));

CREATE POLICY "Project owners can update members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (is_project_owner(project_id))
  WITH CHECK (is_project_owner(project_id));

CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  TO authenticated
  USING (is_project_owner(project_id));

-- Drop and recreate is_project_member with fixed search_path
DROP FUNCTION IF EXISTS is_project_member(uuid) CASCADE;

CREATE OR REPLACE FUNCTION is_project_member(project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_members.project_id = is_project_member.project_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Recreate dependent policy if it exists
CREATE POLICY "Users can view projects they are members of"
  ON projects FOR SELECT
  TO authenticated
  USING (is_project_member(id));

-- Drop and recreate is_admin with fixed search_path
DROP FUNCTION IF EXISTS is_admin() CASCADE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = auth.uid()) = 'admin';
END;
$$;

-- Recreate admin policies
CREATE POLICY "Admins can view all projects"
  ON projects FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete all projects"
  ON projects FOR DELETE
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can view all project members"
  ON project_members FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can add project members"
  ON project_members FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update project members"
  ON project_members FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can remove project members"
  ON project_members FOR DELETE
  TO authenticated
  USING (is_admin());

-- Drop and recreate update_projects_updated_at with fixed search_path
DROP FUNCTION IF EXISTS update_projects_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();