/*
  # Create keywords table

  1. New Tables
    - `keywords`
      - `id` (uuid, primary key) - Unique identifier for each keyword
      - `keyword` (text) - The keyword text
      - `google_rank` (integer) - Current Google ranking position
      - `visibility` (numeric) - Visibility percentage (0-100)
      - `kei` (numeric) - Keyword Effectiveness Index
      - `expected_traffic` (integer) - Expected monthly traffic
      - `user_id` (uuid) - Reference to the user who owns this keyword
      - `created_at` (timestamptz) - When the keyword was added
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `keywords` table
    - Add policies for authenticated users to manage their own keywords
    - Admins can view all keywords
*/

CREATE TABLE IF NOT EXISTS keywords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  google_rank integer DEFAULT 0,
  visibility numeric(5,2) DEFAULT 0.00,
  kei numeric(10,2) DEFAULT 0.00,
  expected_traffic integer DEFAULT 0,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own keywords"
  ON keywords
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

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

CREATE POLICY "Users can insert own keywords"
  ON keywords
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own keywords"
  ON keywords
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own keywords"
  ON keywords
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_keywords_user_id ON keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_google_rank ON keywords(google_rank);
