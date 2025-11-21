/*
  # Update is_admin() Function to Include Super Admin

  1. Changes
    - Update is_admin() function to return true for both 'admin' and 'super_admin' roles
    - This gives super_admin the same permissions as admin on projects and project members
  
  2. Security
    - Super Admin now has full admin access to all projects and project members
    - Maintains existing security model while extending it to super_admin role
*/

-- Drop and recreate the is_admin function to include super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'super_admin');
END;
$$;
