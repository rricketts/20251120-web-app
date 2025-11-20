-- Database Schema for Material Kit React Application
-- Run this SQL in your Supabase SQL Editor

-- =====================================================
-- CREATE TABLES
-- =====================================================

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

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE POLICIES
-- =====================================================

-- Users table policies
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
CREATE POLICY "Allow public read access to users"
  ON users FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to users" ON users;
CREATE POLICY "Allow authenticated insert to users"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update to users" ON users;
CREATE POLICY "Allow authenticated update to users"
  ON users FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete to users" ON users;
CREATE POLICY "Allow authenticated delete to users"
  ON users FOR DELETE
  TO authenticated
  USING (true);

-- Products table policies
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
CREATE POLICY "Allow public read access to products"
  ON products FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to products" ON products;
CREATE POLICY "Allow authenticated insert to products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update to products" ON products;
CREATE POLICY "Allow authenticated update to products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete to products" ON products;
CREATE POLICY "Allow authenticated delete to products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- Posts table policies
DROP POLICY IF EXISTS "Allow public read access to posts" ON posts;
CREATE POLICY "Allow public read access to posts"
  ON posts FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert to posts" ON posts;
CREATE POLICY "Allow authenticated insert to posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update to posts" ON posts;
CREATE POLICY "Allow authenticated update to posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete to posts" ON posts;
CREATE POLICY "Allow authenticated delete to posts"
  ON posts FOR DELETE
  TO authenticated
  USING (true);

-- =====================================================
-- CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_posts_posted_at ON posts(posted_at DESC);
