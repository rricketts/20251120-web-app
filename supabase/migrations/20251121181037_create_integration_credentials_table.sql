/*
  # Create Integration Credentials Table

  1. New Tables
    - `integration_credentials`
      - `id` (uuid, primary key) - Unique identifier for each credential record
      - `project_id` (uuid, foreign key) - Links credentials to a specific project
      - `integration_type` (text) - Type of integration (e.g., 'google_search_console', 'google_analytics')
      - `client_id` (text) - OAuth client ID
      - `client_secret` (text) - Encrypted OAuth client secret
      - `api_key` (text, nullable) - Optional API key
      - `access_token` (text, nullable) - OAuth access token
      - `refresh_token` (text, nullable) - OAuth refresh token
      - `token_expiry` (timestamptz, nullable) - Token expiration timestamp
      - `selected_property` (text, nullable) - Selected property/site URL
      - `additional_config` (jsonb, nullable) - Additional configuration as JSON
      - `is_active` (boolean) - Whether the integration is currently active
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp
      - `created_by` (uuid, foreign key) - User who created the integration

  2. Security
    - Enable RLS on `integration_credentials` table
    - Add policy for users to view credentials for their projects
    - Add policy for managers/admins to create credentials
    - Add policy for managers/admins to update credentials
    - Add policy for managers/admins to delete credentials

  3. Indexes
    - Add index on project_id for fast lookups
    - Add unique index on (project_id, integration_type) to prevent duplicates
*/

CREATE TABLE IF NOT EXISTS integration_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  integration_type text NOT NULL,
  client_id text,
  client_secret text,
  api_key text,
  access_token text,
  refresh_token text,
  token_expiry timestamptz,
  selected_property text,
  additional_config jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users(id),
  CONSTRAINT valid_integration_type CHECK (integration_type IN (
    'google_search_console',
    'google_analytics',
    'google_ads',
    'google_business_profile',
    'shopify',
    'wix',
    'wordpress',
    'webflow'
  ))
);

CREATE INDEX IF NOT EXISTS idx_integration_credentials_project_id ON integration_credentials(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_credentials_project_type ON integration_credentials(project_id, integration_type);

ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credentials for their projects"
  ON integration_credentials FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = integration_credentials.project_id
      AND project_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Managers and admins can create credentials"
  ON integration_credentials FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      JOIN users ON users.id = auth.uid()
      WHERE project_members.project_id = integration_credentials.project_id
      AND project_members.user_id = auth.uid()
      AND (
        users.role IN ('admin', 'super_admin')
        OR project_members.role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Managers and admins can update credentials"
  ON integration_credentials FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      JOIN users ON users.id = auth.uid()
      WHERE project_members.project_id = integration_credentials.project_id
      AND project_members.user_id = auth.uid()
      AND (
        users.role IN ('admin', 'super_admin')
        OR project_members.role IN ('owner', 'admin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      JOIN users ON users.id = auth.uid()
      WHERE project_members.project_id = integration_credentials.project_id
      AND project_members.user_id = auth.uid()
      AND (
        users.role IN ('admin', 'super_admin')
        OR project_members.role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "Managers and admins can delete credentials"
  ON integration_credentials FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      JOIN users ON users.id = auth.uid()
      WHERE project_members.project_id = integration_credentials.project_id
      AND project_members.user_id = auth.uid()
      AND (
        users.role IN ('admin', 'super_admin')
        OR project_members.role IN ('owner', 'admin')
      )
    )
  );

CREATE OR REPLACE FUNCTION update_integration_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_integration_credentials_updated_at
  BEFORE UPDATE ON integration_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_integration_credentials_updated_at();
