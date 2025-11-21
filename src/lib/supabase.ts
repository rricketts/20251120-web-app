import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  status: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  price_sale: number | null;
  cover_url: string | null;
  colors: string[];
  status: string;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  title: string;
  description: string;
  cover_url: string | null;
  author_name: string;
  author_avatar_url: string | null;
  total_views: number;
  total_comments: number;
  total_shares: number;
  total_favorites: number;
  posted_at: string;
  created_at: string;
  updated_at: string;
};
