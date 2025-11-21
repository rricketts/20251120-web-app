/*
  # Fix Project Creation Policies

  ## Overview
  This migration fixes the RLS policies for project creation to allow admins and managers
  to successfully create projects.

  ## Changes
  1. Update admin INSERT policy to allow any owner_id
  2. Ensure manager INSERT policy allows setting themselves as owner

  ## Security Notes
  - Admins can create projects with any owner_id (super admin privilege)
  - Managers can only create projects where they are the owner
*/

-- Drop existing INSERT policies
DROP POLICY IF EXISTS "Admins can create projects" ON projects;
DROP POLICY IF EXISTS "Managers can create projects" ON projects;

-- Admin INSERT policy: Admins can create projects with any owner
CREATE POLICY "Admins can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

-- Manager INSERT policy: Managers can create projects where they are the owner
CREATE POLICY "Managers can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (is_manager() AND owner_id = auth.uid());
