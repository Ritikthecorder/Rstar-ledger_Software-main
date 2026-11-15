-- ============================================================================
-- LedgerPro — Complete Supabase Schema
-- Paste this entire file into: Supabase Dashboard -> SQL Editor -> New query -> Run
-- Safe to re-run (idempotent).
-- ============================================================================

-- 1. customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  opening_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit','debit')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT,
  payment_mode TEXT CHECK (payment_mode IN ('cash','upi','bank','card')),
  reference_id TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  attachment_url TEXT,
  created_by UUID REFERENCES auth.users(id)
);

-- 3. settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT DEFAULT '',
  currency TEXT DEFAULT 'INR',
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light','dark','system'))
);

-- 4. customer_portals (shareable read-only statements)
CREATE TABLE IF NOT EXISTS customer_portals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL,
  customer_id UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload     JSONB NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. business_members (team access / roles)
CREATE TABLE IF NOT EXISTS business_members (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email  TEXT NOT NULL,
  role           TEXT NOT NULL CHECK (role IN ('staff','viewer')),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','revoked')),
  invite_token   TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  accepted_at    TIMESTAMPTZ
);

-- RLS enable
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- customers policies
DROP POLICY IF EXISTS "Users own customers" ON customers;
DROP POLICY IF EXISTS "owners_and_members_read_customers" ON customers;
DROP POLICY IF EXISTS "owners_and_staff_write_customers" ON customers;
DROP POLICY IF EXISTS "owners_and_staff_update_customers" ON customers;
DROP POLICY IF EXISTS "owners_delete_customers" ON customers;

CREATE POLICY "owners_and_members_read_customers" ON customers
  FOR SELECT USING (
    auth.uid() = user_id
    OR user_id IN (SELECT owner_id FROM business_members WHERE member_user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "owners_and_staff_write_customers" ON customers
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR user_id IN (SELECT owner_id FROM business_members WHERE member_user_id = auth.uid() AND status = 'active' AND role = 'staff')
  );
CREATE POLICY "owners_and_staff_update_customers" ON customers
  FOR UPDATE USING (
    auth.uid() = user_id
    OR user_id IN (SELECT owner_id FROM business_members WHERE member_user_id = auth.uid() AND status = 'active' AND role = 'staff')
  );
CREATE POLICY "owners_delete_customers" ON customers
  FOR DELETE USING (auth.uid() = user_id);

-- transactions policies
DROP POLICY IF EXISTS "Users own transactions" ON transactions;
DROP POLICY IF EXISTS "owners_and_members_read_transactions" ON transactions;
DROP POLICY IF EXISTS "owners_and_staff_write_transactions" ON transactions;
DROP POLICY IF EXISTS "owners_and_staff_update_transactions" ON transactions;
DROP POLICY IF EXISTS "owners_delete_transactions" ON transactions;

CREATE POLICY "owners_and_members_read_transactions" ON transactions
  FOR SELECT USING (
    auth.uid() = user_id
    OR user_id IN (SELECT owner_id FROM business_members WHERE member_user_id = auth.uid() AND status = 'active')
  );
CREATE POLICY "owners_and_staff_write_transactions" ON transactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR user_id IN (SELECT owner_id FROM business_members WHERE member_user_id = auth.uid() AND status = 'active' AND role = 'staff')
  );
CREATE POLICY "owners_and_staff_update_transactions" ON transactions
  FOR UPDATE USING (
    auth.uid() = user_id
    OR user_id IN (SELECT owner_id FROM business_members WHERE member_user_id = auth.uid() AND status = 'active' AND role = 'staff')
  );
CREATE POLICY "owners_delete_transactions" ON transactions
  FOR DELETE USING (auth.uid() = user_id);

-- settings policies (owner only)
DROP POLICY IF EXISTS "Users own settings" ON settings;
CREATE POLICY "Users own settings" ON settings
  FOR ALL USING (auth.uid() = user_id);

-- customer_portals policies
DROP POLICY IF EXISTS "auth_manage_portals" ON customer_portals;
DROP POLICY IF EXISTS "public_read_valid_portals" ON customer_portals;

CREATE POLICY "auth_manage_portals" ON customer_portals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "public_read_valid_portals" ON customer_portals
  FOR SELECT USING (expires_at > now());

-- business_members policies
DROP POLICY IF EXISTS "members_owner_manage" ON business_members;
DROP POLICY IF EXISTS "members_self_read" ON business_members;

CREATE POLICY "members_owner_manage" ON business_members
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "members_self_read" ON business_members
  FOR SELECT USING (auth.uid() = member_user_id);
