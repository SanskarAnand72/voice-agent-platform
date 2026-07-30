-- ============================================================
-- Voice AI Agent Platform - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- -------------------------------------------------------
-- USERS TABLE (extends auth.users)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  phone TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free', -- free, pro, enterprise
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_delete_own" ON public.users FOR DELETE USING (auth.uid() = id);

-- -------------------------------------------------------
-- WORKSPACES TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspaces_select_member" ON public.workspaces FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = id AND user_id = auth.uid())
);
CREATE POLICY "workspaces_insert_owner" ON public.workspaces FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "workspaces_update_owner" ON public.workspaces FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "workspaces_delete_owner" ON public.workspaces FOR DELETE USING (auth.uid() = owner_id);

-- -------------------------------------------------------
-- WORKSPACE MEMBERS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- owner, admin, member
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_members_select" ON public.workspace_members FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "workspace_members_insert" ON public.workspace_members FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "workspace_members_delete" ON public.workspace_members FOR DELETE USING (user_id = auth.uid());

-- -------------------------------------------------------
-- AI AGENTS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assistant_id TEXT UNIQUE NOT NULL DEFAULT 'asst_' || replace(gen_random_uuid()::text, '-', '')::text,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  system_prompt TEXT NOT NULL DEFAULT 'You are a helpful AI voice assistant. Be concise, natural, and professional.',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  voice_provider TEXT DEFAULT 'elevenlabs', -- elevenlabs, twilio
  voice_id TEXT, -- ElevenLabs voice ID
  language TEXT DEFAULT 'en-US',
  temperature DECIMAL(3,2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 200,
  phone_number TEXT, -- Twilio phone number assigned to agent
  webhook_url TEXT, -- User-defined webhook for call events
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, archived
  call_recording BOOLEAN DEFAULT true,
  transcription_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agents_select_own" ON public.agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "agents_insert_own" ON public.agents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agents_update_own" ON public.agents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "agents_delete_own" ON public.agents FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- PHONE NUMBERS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  number TEXT NOT NULL UNIQUE,
  friendly_name TEXT,
  twilio_sid TEXT,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active', -- active, inactive
  capabilities JSONB DEFAULT '{"voice": true, "sms": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phone_numbers_select_own" ON public.phone_numbers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "phone_numbers_insert_own" ON public.phone_numbers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "phone_numbers_update_own" ON public.phone_numbers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "phone_numbers_delete_own" ON public.phone_numbers FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- CALLS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  twilio_call_sid TEXT UNIQUE,
  caller_phone TEXT,
  agent_phone TEXT,
  direction TEXT NOT NULL DEFAULT 'inbound', -- inbound, outbound
  status TEXT NOT NULL DEFAULT 'initiated', -- initiated, ringing, in-progress, completed, failed, cancelled, busy, no-answer
  duration INTEGER, -- in seconds
  cost DECIMAL(10,4),
  recording_url TEXT,
  recording_sid TEXT,
  transcript TEXT,
  summary TEXT,
  sentiment TEXT, -- positive, neutral, negative
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "calls_select_own" ON public.calls FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "calls_insert_own" ON public.calls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "calls_update_own" ON public.calls FOR UPDATE USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- CALL LOGS TABLE (real-time transcripts & events)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- user_speech, ai_response, system_event, error
  content TEXT NOT NULL,
  timestamp_ms BIGINT NOT NULL DEFAULT 0,
  confidence DECIMAL(4,3), -- speech confidence (0-1)
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "call_logs_select_own" ON public.call_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "call_logs_insert_own" ON public.call_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- API KEYS TABLE
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE, -- bcrypt hash of the actual key
  key_prefix TEXT NOT NULL, -- first 8 chars for display (e.g. "vapi_sk_")
  last_used_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[] DEFAULT ARRAY['calls:read', 'calls:write', 'agents:read', 'agents:write'],
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_select_own" ON public.api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "api_keys_insert_own" ON public.api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "api_keys_update_own" ON public.api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "api_keys_delete_own" ON public.api_keys FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- WEBHOOKS TABLE (user-configured event webhooks)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE, -- null = global webhook
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT ARRAY['call_started', 'call_completed', 'transcript_ready'],
  secret TEXT, -- for HMAC signature verification
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_select_own" ON public.webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "webhooks_insert_own" ON public.webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "webhooks_update_own" ON public.webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "webhooks_delete_own" ON public.webhooks FOR DELETE USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- WEBHOOK DELIVERIES TABLE (delivery history for debugging)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  success BOOLEAN DEFAULT false,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_deliveries_select_own" ON public.webhook_deliveries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "webhook_deliveries_insert_own" ON public.webhook_deliveries FOR INSERT WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- INDEXES
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON public.agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_workspace_id ON public.agents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agents_phone_number ON public.agents(phone_number);
CREATE INDEX IF NOT EXISTS idx_agents_assistant_id ON public.agents(assistant_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON public.agents(status);
CREATE INDEX IF NOT EXISTS idx_calls_agent_id ON public.calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON public.calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_twilio_sid ON public.calls(twilio_call_sid);
CREATE INDEX IF NOT EXISTS idx_calls_status ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON public.calls(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_id ON public.call_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_user_id ON public.call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_timestamp ON public.call_logs(call_id, timestamp_ms);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON public.webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON public.webhook_deliveries(webhook_id);

-- -------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- -------------------------------------------------------

-- Auto-create user profile after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  workspace_id UUID;
BEGIN
  -- Insert user profile
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default workspace
  INSERT INTO public.workspaces (name, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)) || '''s Workspace',
    NEW.id
  )
  RETURNING id INTO workspace_id;

  -- Add user as workspace owner
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (workspace_id, NEW.id, 'owner')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_agents_updated_at ON public.agents;
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_calls_updated_at ON public.calls;
CREATE TRIGGER update_calls_updated_at BEFORE UPDATE ON public.calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_keys_updated_at ON public.api_keys;
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhooks_updated_at ON public.webhooks;
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
