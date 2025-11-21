/*
  # Remove Unused Indexes

  1. Changes
    - Drop unused indexes that are not being utilized
    - This frees up storage and reduces maintenance overhead
    - Indexes can be recreated if needed in the future

  2. Indexes removed
    - idx_keywords_keyword
    - idx_keywords_google_rank
    - idx_competitors_user_id
    - idx_competitors_domain
    - idx_backlinks_user_id
    - idx_backlinks_backlink
    - idx_backlinks_anchor_url
    - idx_users_status
    - idx_products_status
    - idx_users_created_by
*/

-- Drop unused indexes on keywords table
DROP INDEX IF EXISTS idx_keywords_keyword;
DROP INDEX IF EXISTS idx_keywords_google_rank;

-- Drop unused indexes on competitors table
DROP INDEX IF EXISTS idx_competitors_user_id;
DROP INDEX IF EXISTS idx_competitors_domain;

-- Drop unused indexes on backlinks table
DROP INDEX IF EXISTS idx_backlinks_user_id;
DROP INDEX IF EXISTS idx_backlinks_backlink;
DROP INDEX IF EXISTS idx_backlinks_anchor_url;

-- Drop unused indexes on users table
DROP INDEX IF EXISTS idx_users_status;
DROP INDEX IF EXISTS idx_users_created_by;

-- Drop unused indexes on products table
DROP INDEX IF EXISTS idx_products_status;