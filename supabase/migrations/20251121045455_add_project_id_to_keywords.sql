/*
  # Add project_id to keywords table

  1. Changes
    - Add `project_id` column to keywords table
    - Add foreign key constraint to projects table
    - Create index for better query performance
    - Update RLS policies to filter by project_id

  2. Important Notes
    - Existing keywords will have NULL project_id initially
    - Applications should set project_id when creating new keywords
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'keywords' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE keywords ADD COLUMN project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_keywords_project_id ON keywords(project_id);

DROP POLICY IF EXISTS "Users can view own keywords" ON keywords;
DROP POLICY IF EXISTS "Admins can view all keywords" ON keywords;
DROP POLICY IF EXISTS "Users can insert own keywords" ON keywords;
DROP POLICY IF EXISTS "Users can update own keywords" ON keywords;
DROP POLICY IF EXISTS "Users can delete own keywords" ON keywords;

CREATE POLICY "Users can view keywords in their projects"
  ON keywords
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = keywords.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all keywords"
  ON keywords
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert keywords in their projects"
  ON keywords
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = keywords.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update keywords in their projects"
  ON keywords
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = keywords.project_id
      AND project_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = keywords.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete keywords in their projects"
  ON keywords
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = keywords.project_id
      AND project_members.user_id = auth.uid()
    )
  );
