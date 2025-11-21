/*
  # Create backlinks table

  1. New Tables
    - `backlinks`
      - `id` (uuid, primary key) - Unique identifier for each backlink
      - `backlink` (text) - The backlink URL
      - `nofollow` (boolean) - Whether the backlink is nofollow
      - `anchor_text` (text) - The anchor text used for the backlink
      - `anchor_url` (text) - The URL where the backlink is located
      - `google_pr` (integer) - Google PageRank score (0-10)
      - `alexa_rank` (bigint) - Alexa ranking position
      - `project_id` (uuid) - Reference to the project this backlink belongs to
      - `user_id` (uuid) - Reference to the user who owns this backlink
      - `created_at` (timestamptz) - When the backlink was added
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `backlinks` table
    - Add policies for users to manage backlinks in their projects
    - Admins can view all backlinks
*/

CREATE TABLE IF NOT EXISTS backlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backlink text NOT NULL,
  nofollow boolean DEFAULT false,
  anchor_text text DEFAULT '',
  anchor_url text NOT NULL,
  google_pr integer DEFAULT 0,
  alexa_rank bigint DEFAULT 0,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view backlinks in their projects"
  ON backlinks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = backlinks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all backlinks"
  ON backlinks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert backlinks in their projects"
  ON backlinks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = backlinks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update backlinks in their projects"
  ON backlinks
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = backlinks.project_id
      AND project_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = backlinks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete backlinks in their projects"
  ON backlinks
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = backlinks.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_backlinks_user_id ON backlinks(user_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_project_id ON backlinks(project_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_backlink ON backlinks(backlink);
CREATE INDEX IF NOT EXISTS idx_backlinks_anchor_url ON backlinks(anchor_url);
