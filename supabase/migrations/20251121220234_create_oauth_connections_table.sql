/*
  # Create OAuth Connections Table

  1. New Tables
    - `oauth_connections`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `provider` (text) - OAuth provider name (e.g., 'google_search_console')
      - `access_token` (text) - Current access token
      - `refresh_token` (text, nullable) - Refresh token for obtaining new access tokens
      - `token_expires_at` (timestamptz, nullable) - When the access token expires
      - `scope` (text) - OAuth scopes granted
      - `created_at` (timestamptz) - When connection was created
      - `updated_at` (timestamptz) - When connection was last updated

  2. Security
    - Enable RLS on `oauth_connections` table
    - Add policy for users to read their own connections
    - Add policy for users to insert their own connections
    - Add policy for users to update their own connections
    - Add policy for users to delete their own connections

  3. Indexes
    - Add index on user_id for fast lookups
    - Add unique index on (user_id, provider) to prevent duplicate connections
*/

CREATE TABLE IF NOT EXISTS oauth_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  scope text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_provider UNIQUE (user_id, provider)
);

ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own OAuth connections"
  ON oauth_connections
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own OAuth connections"
  ON oauth_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own OAuth connections"
  ON oauth_connections
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own OAuth connections"
  ON oauth_connections
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_oauth_connections_user_id ON oauth_connections(user_id);

CREATE OR REPLACE FUNCTION update_oauth_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_oauth_connections_updated_at
  BEFORE UPDATE ON oauth_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_oauth_connections_updated_at();