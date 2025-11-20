/*
  # Create Test User

  1. Purpose
    - Creates a test user account for authentication testing
  
  2. User Details
    - Email: hello@gmail.com
    - Password: @demo1234
  
  3. Notes
    - This is a demo/test user for development purposes
    - Password is intentionally simple for testing
*/

DO $$
DECLARE
  user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO user_id FROM auth.users WHERE email = 'hello@gmail.com';
  
  -- Only create if user doesn't exist
  IF user_id IS NULL THEN
    -- Insert user into auth.users table
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'hello@gmail.com',
      crypt('@demo1234', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{}'::jsonb,
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
    
    -- Get the newly created user id
    SELECT id INTO user_id FROM auth.users WHERE email = 'hello@gmail.com';
    
    -- Insert identity
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      user_id,
      'hello@gmail.com',
      format('{"sub":"%s","email":"hello@gmail.com"}', user_id)::jsonb,
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  END IF;
END $$;
