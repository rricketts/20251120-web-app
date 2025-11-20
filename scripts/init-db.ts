import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const createTables = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  company text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'User',
  is_verified boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL DEFAULT 0,
  price_sale numeric(10, 2),
  cover_url text,
  colors jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_url text,
  author_name text NOT NULL,
  author_avatar_url text,
  total_views integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  total_shares integer DEFAULT 0,
  total_favorites integer DEFAULT 0,
  posted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON posts(posted_at DESC);
`;

const createPolicies = `
-- Users table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public read access to users'
  ) THEN
    CREATE POLICY "Allow public read access to users"
      ON users FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow authenticated insert to users'
  ) THEN
    CREATE POLICY "Allow authenticated insert to users"
      ON users FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow authenticated update to users'
  ) THEN
    CREATE POLICY "Allow authenticated update to users"
      ON users FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow authenticated delete to users'
  ) THEN
    CREATE POLICY "Allow authenticated delete to users"
      ON users FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Products table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow public read access to products'
  ) THEN
    CREATE POLICY "Allow public read access to products"
      ON products FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow authenticated insert to products'
  ) THEN
    CREATE POLICY "Allow authenticated insert to products"
      ON products FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow authenticated update to products'
  ) THEN
    CREATE POLICY "Allow authenticated update to products"
      ON products FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow authenticated delete to products'
  ) THEN
    CREATE POLICY "Allow authenticated delete to products"
      ON products FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Posts table policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Allow public read access to posts'
  ) THEN
    CREATE POLICY "Allow public read access to posts"
      ON posts FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Allow authenticated insert to posts'
  ) THEN
    CREATE POLICY "Allow authenticated insert to posts"
      ON posts FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Allow authenticated update to posts'
  ) THEN
    CREATE POLICY "Allow authenticated update to posts"
      ON posts FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'Allow authenticated delete to posts'
  ) THEN
    CREATE POLICY "Allow authenticated delete to posts"
      ON posts FOR DELETE
      TO authenticated
      USING (true);
  END IF;
END $$;
`;

async function initializeDatabase() {
  console.log('Initializing database...');

  try {
    console.log('Creating tables...');
    const { error: tablesError } = await supabase.rpc('exec_sql', { sql: createTables });

    if (tablesError) {
      console.error('Error creating tables:', tablesError);
      throw tablesError;
    }

    console.log('Creating policies...');
    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: createPolicies });

    if (policiesError) {
      console.error('Error creating policies:', policiesError);
      throw policiesError;
    }

    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();
