/*
  # Create Test Users with Different Roles

  1. Purpose
    - Creates test user accounts for each role type
  
  2. Test Users
    - admin@test.com - Admin role (password: admin123)
    - manager@test.com - Manager role (password: manager123)
    - user@test.com - User role (password: user123)
  
  3. Notes
    - These are demo/test users for development purposes
    - Passwords are intentionally simple for testing
*/

DO $$
DECLARE
  admin_user_id uuid;
  manager_user_id uuid;
  regular_user_id uuid;
BEGIN
  -- Create admin user
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@test.com';
  
  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
      'authenticated', 'authenticated', 'admin@test.com',
      crypt('admin123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      NOW(), NOW(), '', '', '', ''
    );
    
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@test.com';
    
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), admin_user_id, 'admin@test.com',
      format('{"sub":"%s","email":"admin@test.com"}', admin_user_id)::jsonb,
      'email', NOW(), NOW(), NOW()
    );
    
    INSERT INTO users (id, name, email, company, role, is_verified, status, created_at, updated_at)
    VALUES (admin_user_id, 'Admin User', 'admin@test.com', 'Test Corp', 'admin', true, 'active', NOW(), NOW());
  END IF;

  -- Create manager user
  SELECT id INTO manager_user_id FROM auth.users WHERE email = 'manager@test.com';
  
  IF manager_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
      'authenticated', 'authenticated', 'manager@test.com',
      crypt('manager123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      NOW(), NOW(), '', '', '', ''
    );
    
    SELECT id INTO manager_user_id FROM auth.users WHERE email = 'manager@test.com';
    
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), manager_user_id, 'manager@test.com',
      format('{"sub":"%s","email":"manager@test.com"}', manager_user_id)::jsonb,
      'email', NOW(), NOW(), NOW()
    );
    
    INSERT INTO users (id, name, email, company, role, is_verified, status, created_at, updated_at)
    VALUES (manager_user_id, 'Manager User', 'manager@test.com', 'Test Corp', 'manager', true, 'active', NOW(), NOW());
  END IF;

  -- Create regular user
  SELECT id INTO regular_user_id FROM auth.users WHERE email = 'user@test.com';
  
  IF regular_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
      'authenticated', 'authenticated', 'user@test.com',
      crypt('user123', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
      NOW(), NOW(), '', '', '', ''
    );
    
    SELECT id INTO regular_user_id FROM auth.users WHERE email = 'user@test.com';
    
    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), regular_user_id, 'user@test.com',
      format('{"sub":"%s","email":"user@test.com"}', regular_user_id)::jsonb,
      'email', NOW(), NOW(), NOW()
    );
    
    INSERT INTO users (id, name, email, company, role, is_verified, status, created_at, updated_at)
    VALUES (regular_user_id, 'Regular User', 'user@test.com', 'Test Corp', 'user', true, 'active', NOW(), NOW());
  END IF;
END $$;
