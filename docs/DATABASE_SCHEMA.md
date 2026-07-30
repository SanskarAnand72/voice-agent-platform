# Database Schema - Multi-Tenant Voice AI SaaS

## 🗄️ Overview
- **Database**: PostgreSQL 15+
- **Strategy**: Shared database, Row-Level Security (RLS)
- **ORM**: Prisma / Drizzle ORM
- **Migrations**: Automated via ORM

## 📊 Entity Relationship Diagram

```
workspaces (tenant root)
    ↓
    ├── users (many-to-many via workspace_members)
    ├── ai_agents
    ├── calls
    ├── wallet_transactions
    ├── billing_plans
    ├── api_keys
    └── integrations

ai_agents
    ↓
    ├── agent_prompts
    ├── agent_tools
    ├── agent_flows
    └── calls

calls
    ↓
    ├── call_transcripts
    ├── call_recordings
    ├── call_analytics
    └── call_scores

users
    ↓
    ├── user_sessions
    ├── user_activity_logs
    └── user_preferences
```

## 📋 Core Tables

### 1. Workspaces (Tenants)
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  
  -- White-label settings
  custom_domain VARCHAR(255) UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#6366f1',
  secondary_color VARCHAR(7) DEFAULT '#8b5cf6',
  css_overrides TEXT,
  whitelabel_enabled BOOLEAN DEFAULT FALSE,
  
  -- Subscription
  plan_id UUID REFERENCES billing_plans(id),
  plan_status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired
  trial_ends_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,
  
  -- Wallet
  wallet_balance DECIMAL(10, 2) DEFAULT 0.00,
  low_balance_threshold DECIMAL(10, 2) DEFAULT 10.00,
  low_balance_notified BOOLEAN DEFAULT FALSE,
  
  -- Usage limits
  max_users INTEGER DEFAULT 5,
  max_agents INTEGER DEFAULT 10,
  max_calls_per_month INTEGER DEFAULT 1000,
  max_minutes_per_month INTEGER DEFAULT 10000,
  
  -- Billing
  billing_email VARCHAR(255),
  tax_id VARCHAR(100),
  billing_address JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_suspended BOOLEAN DEFAULT FALSE,
  suspension_reason TEXT,
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_custom_domain ON workspaces(custom_domain);
CREATE INDEX idx_workspaces_plan_id ON workspaces(plan_id);
```

### 2. Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255),
  
  -- Profile
  full_name VARCHAR(255),
  avatar_url TEXT,
  phone VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  
  -- Auth
  oauth_provider VARCHAR(50), -- google, github, etc.
  oauth_id VARCHAR(255),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_email_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  
  -- Metadata
  preferences JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_oauth ON users(oauth_provider, oauth_id);
```

### 3. Workspace Members (Join Table)
```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- owner, admin, agent, viewer
  
  -- Permissions (JSONB for granular control)
  permissions JSONB DEFAULT '{
    "agents": {"create": false, "read": true, "update": false, "delete": false},
    "calls": {"create": false, "read": true, "update": false, "delete": false},
    "analytics": {"read": true},
    "billing": {"read": false, "update": false},
    "settings": {"read": false, "update": false},
    "team": {"invite": false, "remove": false}
  }',
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, invited, suspended
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP DEFAULT NOW(),
  joined_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_role ON workspace_members(workspace_id, role);
```

### 4. AI Agents
```sql
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Basic Info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  
  -- Voice Settings
  voice_provider VARCHAR(50) DEFAULT 'elevenlabs', -- elevenlabs, playht, azure
  voice_id VARCHAR(255),
  voice_settings JSONB DEFAULT '{
    "stability": 0.5,
    "similarity_boost": 0.75,
    "style": 0.0,
    "speaker_boost": true
  }',
  
  -- Language Model
  llm_provider VARCHAR(50) DEFAULT 'openai', -- openai, groq, anthropic, local
  llm_model VARCHAR(100) DEFAULT 'gpt-4-turbo',
  llm_temperature DECIMAL(3, 2) DEFAULT 0.7,
  llm_max_tokens INTEGER DEFAULT 1000,
  llm_fallback_provider VARCHAR(50),
  llm_fallback_model VARCHAR(100),
  
  -- System Prompt
  system_prompt TEXT NOT NULL,
  greeting_message TEXT,
  fallback_message TEXT DEFAULT 'I apologize, but I did not understand that. Could you please rephrase?',
  
  -- Personality & Emotion
  personality VARCHAR(50) DEFAULT 'professional', -- professional, friendly, sales, casual
  emotion_style VARCHAR(50) DEFAULT 'neutral', -- neutral, calm, excited, empathetic
  use_filler_words BOOLEAN DEFAULT FALSE,
  
  -- Speech Recognition
  stt_provider VARCHAR(50) DEFAULT 'deepgram',
  stt_language VARCHAR(10) DEFAULT 'en',
  stt_model VARCHAR(100) DEFAULT 'nova-2',
  
  -- Behavior
  interruption_handling BOOLEAN DEFAULT TRUE,
  background_noise_suppression BOOLEAN DEFAULT TRUE,
  sentiment_detection BOOLEAN DEFAULT FALSE,
  
  -- Memory
  enable_long_term_memory BOOLEAN DEFAULT FALSE,
  enable_session_memory BOOLEAN DEFAULT TRUE,
  memory_retention_days INTEGER DEFAULT 30,
  
  -- Integration
  webhook_url TEXT,
  webhook_events VARCHAR[] DEFAULT ARRAY['call.started', 'call.ended'],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT FALSE, -- for marketplace
  
  -- Usage Stats
  total_calls INTEGER DEFAULT 0,
  total_minutes DECIMAL(10, 2) DEFAULT 0,
  average_rating DECIMAL(3, 2),
  
  -- Metadata
  tags VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
  metadata JSONB DEFAULT '{}',
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX idx_agents_workspace ON ai_agents(workspace_id);
CREATE INDEX idx_agents_active ON ai_agents(workspace_id, is_active);
CREATE INDEX idx_agents_public ON ai_agents(is_public) WHERE is_public = TRUE;
```

### 5. Agent Flows (Visual Builder)
```sql
CREATE TABLE agent_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Flow Definition (JSON)
  flow_data JSONB NOT NULL DEFAULT '{
    "nodes": [],
    "edges": [],
    "variables": {}
  }',
  
  -- Version Control
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  parent_version_id UUID REFERENCES agent_flows(id),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_agent_flows_agent ON agent_flows(agent_id);
CREATE INDEX idx_agent_flows_workspace ON agent_flows(workspace_id);
```

### 6. Calls
```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id),
  
  -- Call Details
  call_sid VARCHAR(255) UNIQUE, -- Twilio Call SID
  direction VARCHAR(20) NOT NULL, -- inbound, outbound
  from_number VARCHAR(20),
  to_number VARCHAR(20),
  
  -- Status
  status VARCHAR(20) DEFAULT 'initiated', -- initiated, ringing, in-progress, completed, failed, no-answer, busy, cancelled
  
  -- Timing
  started_at TIMESTAMP,
  answered_at TIMESTAMP,
  ended_at TIMESTAMP,
  duration_seconds INTEGER DEFAULT 0,
  billable_seconds INTEGER DEFAULT 0,
  
  -- Quality Metrics
  call_quality VARCHAR(20), -- excellent, good, fair, poor
  latency_ms INTEGER,
  packet_loss_percent DECIMAL(5, 2),
  
  -- Outcome
  outcome VARCHAR(50), -- completed, transferred, voicemail, disconnected, error
  outcome_reason TEXT,
  
  -- Sentiment & Scoring
  sentiment_score DECIMAL(3, 2), -- -1 to 1
  ai_score DECIMAL(3, 2), -- 0 to 1
  user_rating INTEGER, -- 1 to 5
  user_feedback TEXT,
  
  -- Cost
  cost_usd DECIMAL(10, 4) DEFAULT 0,
  cost_breakdown JSONB DEFAULT '{
    "stt": 0,
    "tts": 0,
    "llm": 0,
    "telephony": 0
  }',
  
  -- Recording
  recording_url TEXT,
  recording_duration INTEGER,
  recording_size_bytes BIGINT,
  
  -- Metadata
  custom_data JSONB DEFAULT '{}',
  tags VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calls_workspace ON calls(workspace_id);
CREATE INDEX idx_calls_agent ON calls(agent_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX idx_calls_outcome ON calls(outcome);
```

### 7. Call Transcripts
```sql
CREATE TABLE call_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Transcript Entry
  role VARCHAR(20) NOT NULL, -- user, assistant, system
  content TEXT NOT NULL,
  timestamp_ms BIGINT NOT NULL,
  
  -- Metadata
  confidence DECIMAL(3, 2), -- 0 to 1
  emotion VARCHAR(50),
  intent VARCHAR(100),
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transcripts_call ON call_transcripts(call_id);
CREATE INDEX idx_transcripts_workspace ON call_transcripts(workspace_id);
```

### 8. Billing Plans
```sql
CREATE TABLE billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Plan Details
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Pricing
  price_monthly DECIMAL(10, 2) DEFAULT 0,
  price_yearly DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Included Limits
  included_users INTEGER DEFAULT 1,
  included_agents INTEGER DEFAULT 3,
  included_minutes INTEGER DEFAULT 1000,
  
  -- Per-usage Pricing
  price_per_minute DECIMAL(6, 4) DEFAULT 0.10,
  price_per_user DECIMAL(8, 2) DEFAULT 10.00,
  
  -- Features
  features JSONB DEFAULT '{
    "voice_cloning": false,
    "white_label": false,
    "priority_support": false,
    "custom_domain": false,
    "api_access": true,
    "analytics": true,
    "integrations": true
  }',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Stripe Integration
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_billing_plans_slug ON billing_plans(slug);
CREATE INDEX idx_billing_plans_active ON billing_plans(is_active);
```

### 9. Wallet Transactions
```sql
CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Transaction Details
  type VARCHAR(20) NOT NULL, -- credit, debit, refund, bonus
  amount DECIMAL(10, 2) NOT NULL,
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  
  -- Reference
  reference_type VARCHAR(50), -- call, subscription, manual, bonus
  reference_id UUID,
  
  -- Payment
  payment_method VARCHAR(50), -- stripe, razorpay, manual
  payment_id VARCHAR(255),
  
  -- Description
  description TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_transactions_workspace ON wallet_transactions(workspace_id);
CREATE INDEX idx_wallet_transactions_type ON wallet_transactions(type);
CREATE INDEX idx_wallet_transactions_created ON wallet_transactions(created_at DESC);
```

### 10. Invoices
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Invoice Details
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, pending, paid, failed, cancelled
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Period
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  
  -- Line Items
  line_items JSONB DEFAULT '[]',
  
  -- Payment
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  paid_at TIMESTAMP,
  
  -- Dates
  issued_at TIMESTAMP DEFAULT NOW(),
  due_at TIMESTAMP,
  
  -- Files
  pdf_url TEXT,
  
  -- Integration
  stripe_invoice_id VARCHAR(255),
  razorpay_invoice_id VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_workspace ON invoices(workspace_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_period ON invoices(billing_period_start, billing_period_end);
```

### 11. API Keys
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Key Details
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_prefix VARCHAR(20) NOT NULL, -- First 8 chars for display
  
  -- Permissions
  scopes VARCHAR[] DEFAULT ARRAY['calls:read', 'calls:write'],
  
  -- Rate Limiting
  rate_limit_per_minute INTEGER DEFAULT 60,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,
  usage_count INTEGER DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMP,
  
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON api_keys(is_active);
```

### 12. Marketplace Listings
```sql
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  seller_workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  
  -- Listing Details
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100),
  tags VARCHAR[] DEFAULT ARRAY[]::VARCHAR[],
  
  -- Pricing
  price_type VARCHAR(20) DEFAULT 'one_time', -- one_time, subscription
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Revenue Share
  platform_fee_percent DECIMAL(5, 2) DEFAULT 30.00,
  
  -- Media
  thumbnail_url TEXT,
  demo_video_url TEXT,
  screenshots TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Stats
  install_count INTEGER DEFAULT 0,
  rating_average DECIMAL(3, 2),
  rating_count INTEGER DEFAULT 0,
  revenue_total DECIMAL(10, 2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft', -- draft, pending, approved, rejected, suspended
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_marketplace_listings_seller ON marketplace_listings(seller_workspace_id);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_featured ON marketplace_listings(is_featured) WHERE is_featured = TRUE;
```

### 13. Marketplace Purchases
```sql
CREATE TABLE marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id),
  buyer_workspace_id UUID NOT NULL REFERENCES workspaces(id),
  seller_workspace_id UUID NOT NULL REFERENCES workspaces(id),
  
  -- Payment
  amount_paid DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  seller_payout DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  
  -- Payment Processing
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  payment_status VARCHAR(20) DEFAULT 'pending',
  
  -- Payout
  payout_status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  payout_id VARCHAR(255),
  payout_at TIMESTAMP,
  
  -- License
  license_key UUID DEFAULT gen_random_uuid(),
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(listing_id, buyer_workspace_id)
);

CREATE INDEX idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_workspace_id);
CREATE INDEX idx_marketplace_purchases_seller ON marketplace_purchases(seller_workspace_id);
CREATE INDEX idx_marketplace_purchases_listing ON marketplace_purchases(listing_id);
```

### 14. Activity Logs (Audit Trail)
```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  
  -- Action
  action VARCHAR(100) NOT NULL, -- user.login, agent.created, call.started, etc.
  resource_type VARCHAR(50), -- user, agent, call, workspace
  resource_id UUID,
  
  -- Details
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  -- Data
  old_values JSONB,
  new_values JSONB,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_workspace ON activity_logs(workspace_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
```

## 🔐 Row-Level Security (RLS) Policies

### Enable RLS on all tables
```sql
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
-- ... enable for all tables
```

### Example Policies
```sql
-- Users can only see workspaces they're members of
CREATE POLICY workspace_member_access ON workspaces
  FOR ALL
  USING (
    id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can only see agents in their workspaces
CREATE POLICY agent_workspace_access ON ai_agents
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id 
      FROM workspace_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can only insert agents if they have permission
CREATE POLICY agent_create_permission ON ai_agents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_id = ai_agents.workspace_id
        AND user_id = auth.uid()
        AND (permissions->'agents'->>'create')::boolean = true
    )
  );
```

## 📈 Indexes for Performance

```sql
-- Composite indexes for common queries
CREATE INDEX idx_calls_workspace_status_date 
  ON calls(workspace_id, status, started_at DESC);

CREATE INDEX idx_calls_workspace_agent_date 
  ON calls(workspace_id, agent_id, started_at DESC);

-- Full-text search
CREATE INDEX idx_agents_search 
  ON ai_agents USING gin(to_tsvector('english', name || ' ' || description));

-- JSONB indexes
CREATE INDEX idx_workspaces_settings 
  ON workspaces USING gin(settings);

CREATE INDEX idx_agents_metadata 
  ON ai_agents USING gin(metadata);
```

## 🔄 Triggers & Functions

### Auto-update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Repeat for all tables with updated_at
```

### Auto-create workspace owner
```sql
CREATE OR REPLACE FUNCTION create_workspace_owner()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO workspace_members (workspace_id, user_id, role, status)
  VALUES (NEW.id, auth.uid(), 'owner', 'active');
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER workspace_owner_trigger AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION create_workspace_owner();
```

---

**Next**: API Structure & Endpoints
