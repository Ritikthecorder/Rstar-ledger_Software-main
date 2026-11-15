-- Run in Supabase SQL Editor. Safe to re-run (idempotent-ish).

-- 1. Business members table (team invites)
CREATE TABLE IF NOT EXISTS business_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_email text NOT NULL,
  role          text NOT NULL CHECK (role IN ('staff','viewer')),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','revoked')),
  invite_token  text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at    timestamptz DEFAULT now(),
  accepted_at   timestamptz
);

ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "members_owner_manage" ON business_members;
DROP POLICY IF EXISTS "members_self_read" ON business_members;

-- Owner can manage their own team
CREATE POLICY "members_owner_manage" ON business_members
  FOR ALL USING (auth.uid() = owner_id);

-- Members can read their own membership
CREATE POLICY "members_self_read" ON business_members
  FOR SELECT USING (auth.uid() = member_user_id);

-- 2. Add created_by to customers & transactions (who entered the record)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- 3. Update RLS: members can read owner's data
-- customers
DROP POLICY IF EXISTS "Users own customers" ON customers;
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

-- transactions
DROP POLICY IF EXISTS "Users own transactions" ON transactions;
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

-- settings remain owner-only
-- (existing policy "Users own settings" unchanged)
