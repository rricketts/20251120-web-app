/*
  # Create OAuth States Table

  1. New Tables
    - `oauth_states`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `state` (text, the CSRF state token)
      - `created_at` (timestamptz, when the state was created)
      - `expires_at` (timestamptz, when the state expires)

  2. Security
    - Enable RLS on `oauth_states` table
    - Add policy for authenticated users to manage their own states
    - States expire after 10 minutes for security

  3. Indexes
    - Index on state for fast lookups
    - Index on user_id for cleanup queries
*/

CREATE TABLE IF NOT EXISTS oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS oauth_states_state_idx ON oauth_states(state);
CREATE INDEX IF NOT EXISTS oauth_states_user_id_idx ON oauth_states(user_id);
CREATE INDEX IF NOT EXISTS oauth_states_expires_at_idx ON oauth_states(expires_at);

CREATE POLICY "Users can insert own oauth states"
  ON oauth_states FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own oauth states"
  ON oauth_states FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth states"
  ON oauth_states FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM oauth_states
  WHERE expires_at < now();
END;
$$;