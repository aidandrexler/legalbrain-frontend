/*
  # LegalBrain AI — Full Schema

  ## Tables Created
  - `tenants` — Law firm/attorney accounts with API keys and firm info
  - `clients` — Estate planning clients with full financial and physician profiles
  - `diagnostics` — AI diagnostic runs with output, review, and correction tracking
  - `action_items` — Open items requiring attorney attention, sorted by urgency
  - `legal_knowledge` — Knowledge base chunks ingested from legal sources
  - `extraction_jobs` — Async extraction pipeline job tracking
  - `system_improvements` — AI-proposed rule improvements from attorney corrections
  - `rate_table` — §7520 and AFR rates by month
  - `oauth_tokens` — Clio/LEAP OAuth integration tokens
  - `planning_windows` — Temporal planning opportunities detected per client

  ## Security
  - RLS enabled on all tables
  - All policies scoped by auth.uid() through tenants.owner_user_id
  - Tenants: owner can CRUD their own tenant
  - All child tables: scoped via tenant_id matching owner_user_id
*/

-- TENANTS
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  attorney_name text DEFAULT '',
  bar_number text DEFAULT '',
  firm_name text DEFAULT '',
  email text DEFAULT '',
  phone text DEFAULT '',
  primary_jurisdiction text DEFAULT 'FL',
  practice_areas text[] DEFAULT '{}',
  anthropic_api_key_encrypted text DEFAULT '',
  openai_api_key_encrypted text DEFAULT '',
  govinfo_api_key text DEFAULT '',
  courtlistener_token text DEFAULT '',
  sandbox_provisioned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant owner can select own tenant"
  ON tenants FOR SELECT TO authenticated
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Tenant owner can insert own tenant"
  ON tenants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Tenant owner can update own tenant"
  ON tenants FOR UPDATE TO authenticated
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Tenant owner can delete own tenant"
  ON tenants FOR DELETE TO authenticated
  USING (auth.uid() = owner_user_id);

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  date_of_birth date,
  email text DEFAULT '',
  phone text DEFAULT '',
  marital_status text DEFAULT 'single',
  spouse_first_name text DEFAULT '',
  number_of_children integer DEFAULT 0,
  estate_size numeric DEFAULT 0,
  net_worth numeric DEFAULT 0,
  annual_income numeric DEFAULT 0,
  homestead_declared boolean DEFAULT false,
  trust_funded boolean DEFAULT false,
  trust_signed_date date,
  entity_type text DEFAULT '',
  is_physician boolean DEFAULT false,
  physician_specialty text DEFAULT '',
  practice_entity_type text DEFAULT '',
  practice_name text DEFAULT '',
  annual_practice_revenue numeric DEFAULT 0,
  top_payer_concentration numeric DEFAULT 0,
  has_malpractice_coverage boolean DEFAULT false,
  malpractice_limit numeric DEFAULT 0,
  has_buy_sell_agreement boolean DEFAULT false,
  buy_sell_funded boolean DEFAULT false,
  goal_tax_efficiency integer DEFAULT 25,
  goal_risk_reduction integer DEFAULT 25,
  goal_liquidity integer DEFAULT 25,
  goal_simplicity integer DEFAULT 25,
  status text DEFAULT 'intake',
  anticipated_sale_date date,
  anticipated_inheritance_date date,
  anticipated_inheritance_amount numeric DEFAULT 0,
  divorce_risk_flag boolean DEFAULT false,
  health_flag boolean DEFAULT false,
  cpa_name text DEFAULT '',
  financial_advisor_name text DEFAULT '',
  referral_source text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients select by tenant owner"
  ON clients FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Clients insert by tenant owner"
  ON clients FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Clients update by tenant owner"
  ON clients FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Clients delete by tenant owner"
  ON clients FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

-- DIAGNOSTICS
CREATE TABLE IF NOT EXISTS diagnostics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  diagnostic_type text NOT NULL,
  status text DEFAULT 'pending',
  output_text text DEFAULT '',
  drafting_spec jsonb,
  attorney_reviewed boolean DEFAULT false,
  correction_type text DEFAULT 'none',
  correction_significance text DEFAULT 'none',
  correction_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Diagnostics select by tenant owner"
  ON diagnostics FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Diagnostics insert by tenant owner"
  ON diagnostics FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Diagnostics update by tenant owner"
  ON diagnostics FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Diagnostics delete by tenant owner"
  ON diagnostics FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

-- ACTION ITEMS
CREATE TABLE IF NOT EXISTS action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  diagnostic_id uuid REFERENCES diagnostics(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text DEFAULT '',
  urgency text DEFAULT 'MEDIUM',
  status text DEFAULT 'open',
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Action items select by tenant owner"
  ON action_items FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Action items insert by tenant owner"
  ON action_items FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Action items update by tenant owner"
  ON action_items FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Action items delete by tenant owner"
  ON action_items FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

-- LEGAL KNOWLEDGE
CREATE TABLE IF NOT EXISTS legal_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source text NOT NULL,
  source_title text DEFAULT '',
  namespace text DEFAULT 'primary_law',
  confidence_tier integer DEFAULT 2,
  content text DEFAULT '',
  citation text DEFAULT '',
  is_superseded boolean DEFAULT false,
  ingested_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE legal_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal knowledge select by tenant owner"
  ON legal_knowledge FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Legal knowledge insert by tenant owner"
  ON legal_knowledge FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Legal knowledge update by tenant owner"
  ON legal_knowledge FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Legal knowledge delete by tenant owner"
  ON legal_knowledge FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

-- EXTRACTION JOBS
CREATE TABLE IF NOT EXISTS extraction_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id text DEFAULT '',
  source_title text DEFAULT '',
  status text DEFAULT 'pending',
  progress integer DEFAULT 0,
  current_step text DEFAULT '',
  chunks_added integer DEFAULT 0,
  error_message text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Extraction jobs select by tenant owner"
  ON extraction_jobs FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Extraction jobs insert by tenant owner"
  ON extraction_jobs FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Extraction jobs update by tenant owner"
  ON extraction_jobs FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Extraction jobs delete by tenant owner"
  ON extraction_jobs FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

-- SYSTEM IMPROVEMENTS
CREATE TABLE IF NOT EXISTS system_improvements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  diagnostic_type text NOT NULL,
  proposed_rule text NOT NULL,
  trigger_count integer DEFAULT 1,
  status text DEFAULT 'pending',
  final_rule text DEFAULT '',
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System improvements select by tenant owner"
  ON system_improvements FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "System improvements insert by tenant owner"
  ON system_improvements FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "System improvements update by tenant owner"
  ON system_improvements FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "System improvements delete by tenant owner"
  ON system_improvements FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

-- RATE TABLE
CREATE TABLE IF NOT EXISTS rate_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  effective_month text NOT NULL,
  rate_7520 numeric NOT NULL,
  afr_mid_term numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rate_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rate table select by tenant owner"
  ON rate_table FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Rate table insert by tenant owner"
  ON rate_table FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Rate table update by tenant owner"
  ON rate_table FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Rate table delete by tenant owner"
  ON rate_table FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

-- OAUTH TOKENS
CREATE TABLE IF NOT EXISTS oauth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token text DEFAULT '',
  refresh_token text DEFAULT '',
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "OAuth tokens select by tenant owner"
  ON oauth_tokens FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "OAuth tokens insert by tenant owner"
  ON oauth_tokens FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "OAuth tokens update by tenant owner"
  ON oauth_tokens FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "OAuth tokens delete by tenant owner"
  ON oauth_tokens FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

-- PLANNING WINDOWS
CREATE TABLE IF NOT EXISTS planning_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  window_title text NOT NULL,
  description text DEFAULT '',
  urgency text DEFAULT 'MEDIUM',
  due_date date,
  window_type text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE planning_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Planning windows select by tenant owner"
  ON planning_windows FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Planning windows insert by tenant owner"
  ON planning_windows FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Planning windows update by tenant owner"
  ON planning_windows FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()))
  WITH CHECK (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));

CREATE POLICY "Planning windows delete by tenant owner"
  ON planning_windows FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT id FROM tenants WHERE owner_user_id = auth.uid()));
