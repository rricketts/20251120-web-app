/*
  # Create competitors table

  1. New Tables
    - `competitors`
      - `id` (uuid, primary key) - Unique identifier for each competitor
      - `domain` (text) - Competitor domain name
      - `google_pr` (integer) - Google PageRank score (0-10)
      - `alexa_rank` (bigint) - Alexa ranking position
      - `age` (text) - Domain age (e.g., "5 years", "2 months")
      - `pages_in_google` (integer) - Number of pages indexed by Google
      - `backlinks` (integer) - Total number of backlinks
      - `visibility` (numeric) - Visibility percentage (0-100)
      - `project_id` (uuid) - Reference to the project this competitor belongs to
      - `user_id` (uuid) - Reference to the user who owns this competitor
      - `created_at` (timestamptz) - When the competitor was added
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `competitors` table
    - Add policies for users to manage competitors in their projects
    - Admins can view all competitors
*/

CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL,
  google_pr integer DEFAULT 0,
  alexa_rank bigint DEFAULT 0,
  age text DEFAULT '',
  pages_in_google integer DEFAULT 0,
  backlinks integer DEFAULT 0,
  visibility numeric(5,2) DEFAULT 0.00,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view competitors in their projects"
  ON competitors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = competitors.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all competitors"
  ON competitors
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can insert competitors in their projects"
  ON competitors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = competitors.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update competitors in their projects"
  ON competitors
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = competitors.project_id
      AND project_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = competitors.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete competitors in their projects"
  ON competitors
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = competitors.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_competitors_user_id ON competitors(user_id);
CREATE INDEX IF NOT EXISTS idx_competitors_project_id ON competitors(project_id);
CREATE INDEX IF NOT EXISTS idx_competitors_domain ON competitors(domain);
