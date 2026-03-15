-- ============================================================
-- MUSUBI sign SaaS Billing Schema
-- Migration 006: organizations, subscriptions, usage tracking
-- ============================================================

-- 1. Organizations (tenant/workspace)
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_internal boolean NOT NULL DEFAULT false,  -- UNSERメンバー無料フラグ
  stripe_customer_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_owner ON organizations(owner_id);
CREATE INDEX idx_organizations_stripe ON organizations(stripe_customer_id);

-- 2. Organization members
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

-- 3. Plans (static reference table)
CREATE TABLE IF NOT EXISTS plans (
  id text PRIMARY KEY,  -- 'free', 'starter', 'business', 'enterprise'
  name text NOT NULL,
  price_monthly integer NOT NULL DEFAULT 0,       -- 月額（円）
  max_documents_per_month integer,                 -- null = 無制限
  max_users integer,                               -- null = 無制限
  max_templates integer,                           -- null = 無制限
  features jsonb NOT NULL DEFAULT '{}',            -- 追加機能フラグ
  stripe_price_id text,                            -- Stripe Price ID
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default plans
INSERT INTO plans (id, name, price_monthly, max_documents_per_month, max_users, max_templates, features, sort_order) VALUES
  ('free',       'Free',       0,     5,    1,    3,    '{"api": false, "audit_log": false, "ai_review": false, "custom_email": false}', 1),
  ('starter',    'Starter',    2980,  30,   3,    20,   '{"api": false, "audit_log": true, "ai_review": true, "custom_email": true}', 2),
  ('business',   'Business',   5000,  null, null, null, '{"api": true, "audit_log": true, "ai_review": true, "custom_email": true, "webhook": true, "sso": false}', 3),
  ('enterprise', 'Enterprise', 0,     null, null, null, '{"api": true, "audit_log": true, "ai_review": true, "custom_email": true, "webhook": true, "sso": true}', 4)
ON CONFLICT (id) DO NOTHING;

-- 4. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES plans(id),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing', 'paused')),
  stripe_subscription_id text UNIQUE,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  canceled_at timestamptz,
  trial_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- 5. Usage tracking (monthly)
CREATE TABLE IF NOT EXISTS usage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_start date NOT NULL,  -- 月初日 (2026-03-01)
  period_end date NOT NULL,    -- 月末日 (2026-03-31)
  documents_sent integer NOT NULL DEFAULT 0,
  documents_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, period_start)
);

CREATE INDEX idx_usage_org_period ON usage_records(organization_id, period_start);

-- 6. Link documents to organizations
ALTER TABLE documents ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Plans: readable by everyone
CREATE POLICY "Plans are readable by everyone"
  ON plans FOR SELECT USING (true);

-- Organizations: members can read
CREATE POLICY "Organization members can read org"
  ON organizations FOR SELECT
  USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Owner can update org"
  ON organizations FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create org"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Organization members: members can read
CREATE POLICY "Members can read org members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Org owner/admin can manage members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Subscriptions: org members can read
CREATE POLICY "Org members can read subscriptions"
  ON subscriptions FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Usage records: org members can read
CREATE POLICY "Org members can read usage"
  ON usage_records FOR SELECT
  USING (
    organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- Helper functions
-- ============================================================

-- Get current plan for an organization
CREATE OR REPLACE FUNCTION get_org_plan(org_id uuid)
RETURNS TABLE(
  plan_id text,
  plan_name text,
  max_documents_per_month integer,
  max_users integer,
  features jsonb,
  is_internal boolean
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id,
    p.name,
    p.max_documents_per_month,
    p.max_users,
    p.features,
    o.is_internal
  FROM organizations o
  JOIN subscriptions s ON s.organization_id = o.id AND s.status IN ('active', 'trialing')
  JOIN plans p ON p.id = s.plan_id
  WHERE o.id = org_id
  LIMIT 1;
$$;

-- Get current month usage for an organization
CREATE OR REPLACE FUNCTION get_org_usage(org_id uuid)
RETURNS TABLE(documents_sent integer, documents_completed integer) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COALESCE(documents_sent, 0), COALESCE(documents_completed, 0)
  FROM usage_records
  WHERE organization_id = org_id
    AND period_start = date_trunc('month', CURRENT_DATE)::date
  LIMIT 1;
$$;

-- Increment usage counter (called when document is sent)
CREATE OR REPLACE FUNCTION increment_usage(org_id uuid, field text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  month_start date := date_trunc('month', CURRENT_DATE)::date;
  month_end date := (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date;
BEGIN
  INSERT INTO usage_records (organization_id, period_start, period_end, documents_sent, documents_completed)
  VALUES (org_id, month_start, month_end, 0, 0)
  ON CONFLICT (organization_id, period_start) DO NOTHING;

  IF field = 'documents_sent' THEN
    UPDATE usage_records SET documents_sent = documents_sent + 1, updated_at = now()
    WHERE organization_id = org_id AND period_start = month_start;
  ELSIF field = 'documents_completed' THEN
    UPDATE usage_records SET documents_completed = documents_completed + 1, updated_at = now()
    WHERE organization_id = org_id AND period_start = month_start;
  END IF;
END;
$$;
