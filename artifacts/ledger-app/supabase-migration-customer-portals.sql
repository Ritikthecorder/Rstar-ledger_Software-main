-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor)
-- Safe to run multiple times — all statements are idempotent.

-- 1. Create the table (skips if it already exists)
CREATE TABLE IF NOT EXISTS customer_portals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  token       text        UNIQUE NOT NULL,
  customer_id uuid        NOT NULL,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload     jsonb       NOT NULL,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now()
);

-- 2. Enable Row Level Security
ALTER TABLE customer_portals ENABLE ROW LEVEL SECURITY;

-- 3. Drop policies first so re-running never errors
DROP POLICY IF EXISTS "auth_manage_portals" ON customer_portals;
DROP POLICY IF EXISTS "public_read_valid_portals" ON customer_portals;

-- 4. Authenticated users can create, read, update and delete their own links
CREATE POLICY "auth_manage_portals" ON customer_portals
  FOR ALL USING (auth.uid() = user_id);

-- 5. Anyone (no login needed) can read a link that has not yet expired
CREATE POLICY "public_read_valid_portals" ON customer_portals
  FOR SELECT USING (expires_at > now());
