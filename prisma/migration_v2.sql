-- DREAM.CO AI Sales Employee Platform - Migration v2
-- Conversation Engine & Voice AI Schema Additions
--
-- Reference: /home/team/shared/03_CONVERSATION_VOICE_ENGINE.md (§4.3, §4.7, §5.7)
--            /home/team/shared/04_INTEGRATION_GAP_ANALYSIS.md (Gap 3)
--
-- Run this AFTER schema.sql (v1) has been applied.
-- In Supabase: Open SQL Editor → Paste → Run

-- ============================================================
-- 1. Enable pgvector extension (for conversation memory embeddings)
-- ============================================================
-- NOTE: This requires the "Vector" add-on in Supabase.
-- If you don't have it, run: CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 2. Enhance the `leads` table — GPCT scoring, calling fields
-- ============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS gpct_scores JSONB DEFAULT '{}';
COMMENT ON COLUMN leads.gpct_scores IS 'GPCT qualification scores: {goals, plans, challenges, timeline, overall}';

ALTER TABLE leads ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
COMMENT ON COLUMN leads.timezone IS 'Prospect timezone for optimal calling hours';

ALTER TABLE leads ADD COLUMN IF NOT EXISTS best_calling_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00"}';
COMMENT ON COLUMN leads.best_calling_hours IS 'Preferred calling window';

ALTER TABLE leads ADD COLUMN IF NOT EXISTS language_pref TEXT DEFAULT 'en';
COMMENT ON COLUMN leads.language_pref IS 'ISO language code for multilingual communication';

ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
COMMENT ON COLUMN leads.last_contacted_at IS 'Last outreach attempt via any channel';

ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ;
COMMENT ON COLUMN leads.next_followup_at IS 'Scheduled next touchpoint';

ALTER TABLE leads ADD COLUMN IF NOT EXISTS dnd_until TIMESTAMPTZ;
COMMENT ON COLUMN leads.dnd_until IS 'Do Not Disturb until — used after failed call attempts or opt-out';

-- ============================================================
-- 3. New `call_recordings` table — Voice AI call log
-- ============================================================

CREATE TABLE IF NOT EXISTS call_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'ringing', 'in_progress', 'completed', 'failed', 'voicemail', 'busy', 'no_answer'
  )),
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  channel TEXT DEFAULT 'phone' CHECK (channel IN ('phone', 'whatsapp', 'web_rtc')),
  duration_seconds INTEGER DEFAULT 0,
  recording_url TEXT,
  transcript_json JSONB DEFAULT '{}',
  summary TEXT,
  sentiment_timeline JSONB DEFAULT '[]',
  talk_ratio JSONB DEFAULT '{}',
  qualification_score INTEGER DEFAULT 0,
  next_action TEXT,
  ai_health_score INTEGER DEFAULT 0,
  call_provider TEXT DEFAULT 'twilio',
  provider_call_sid TEXT,
  cost_cents INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE call_recordings ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN call_recordings.transcript_json IS 'Full transcript with timestamps and speaker diarization';
COMMENT ON COLUMN call_recordings.sentiment_timeline IS '[{time: "00:00", sentiment: "neutral"}, ...]';
COMMENT ON COLUMN call_recordings.talk_ratio IS '{ai_ms: 60000, user_ms: 90000, ai_pct: 40}';
COMMENT ON COLUMN call_recordings.ai_health_score IS '0-100 conversation quality score';
COMMENT ON COLUMN call_recordings.metadata IS 'Additional call metadata (provider data, custom tags, etc.)';

CREATE INDEX IF NOT EXISTS idx_call_recordings_lead ON call_recordings(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_org ON call_recordings(organization_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_status ON call_recordings(status);
CREATE INDEX IF NOT EXISTS idx_call_recordings_created ON call_recordings(created_at DESC);

-- ============================================================
-- 4. New `conversation_memory` table — Cross-channel vector memory
-- ============================================================

CREATE TABLE IF NOT EXISTS conversation_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'phone', 'linkedin', 'whatsapp', 'chat', 'web')),
  key_topics TEXT[] DEFAULT '{}',
  stated_pain_points TEXT[] DEFAULT '{}',
  objections_raised JSONB DEFAULT '[]',
  intent_signals TEXT[] DEFAULT '{}',
  embedding VECTOR(1536),
  turn_count INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN conversation_memory.objections_raised IS '[{type: "too_expensive", framework_used: "sandler", resolved: true, confidence: 0.9}]';
COMMENT ON COLUMN conversation_memory.intent_signals IS '["budget_mentioned", "timeline_mentioned", "competitor_mentioned"]';
COMMENT ON COLUMN conversation_memory.embedding IS 'OpenAI embedding (1536-dim) for semantic memory search';

CREATE INDEX IF NOT EXISTS idx_conversation_memory_lead ON conversation_memory(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_org ON conversation_memory(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_embedding ON conversation_memory
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- 5. New `campaign_sequence_steps` table — Multi-channel sequences
-- ============================================================

CREATE TABLE IF NOT EXISTS campaign_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'linkedin', 'phone', 'whatsapp', 'sms')),
  delay_hours INTEGER DEFAULT 0,
  template TEXT NOT NULL,
  conditions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE campaign_sequence_steps ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN campaign_sequence_steps.delay_hours IS 'Hours to wait after previous step before executing this one';
COMMENT ON COLUMN campaign_sequence_steps.conditions IS 'Conditional logic: {if_replied: "skip", if_opened: "wait_48h", if_clicked: "fast_forward"}';
COMMENT ON COLUMN campaign_sequence_steps.metadata IS 'Channel-specific config (email subject, phone script, LinkedIn message)';

CREATE INDEX IF NOT EXISTS idx_campaign_sequence_steps_campaign ON campaign_sequence_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sequence_steps_org ON campaign_sequence_steps(organization_id);

-- ============================================================
-- 6. Add metadata column to `chat_messages` for state tracking
-- ============================================================

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
COMMENT ON COLUMN chat_messages.metadata IS 'Conversation metadata: {state, personality_used, objection_detected, sentiment, gpct_scores}';

-- ============================================================
-- 7. RLS Policies for new tables
-- ============================================================

-- Call Recordings: org isolation
CREATE POLICY "Call recordings org isolation" ON call_recordings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Conversation Memory: org isolation
CREATE POLICY "Conversation memory org isolation" ON conversation_memory
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Campaign Sequence Steps: org isolation
CREATE POLICY "Campaign sequence steps org isolation" ON campaign_sequence_steps
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- ============================================================
-- 8. Helper function — Update last_contacted_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_last_contacted()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads
  SET last_contacted_at = NOW()
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on call_recordings
DROP TRIGGER IF EXISTS trg_update_last_contacted_call ON call_recordings;
CREATE TRIGGER trg_update_last_contacted_call
  AFTER INSERT ON call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION update_last_contacted();

-- Trigger on chat_messages
DROP TRIGGER IF EXISTS trg_update_last_contacted_chat ON chat_messages;
CREATE TRIGGER trg_update_last_contacted_chat
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_last_contacted();

-- ============================================================
-- 9. Helper function — Get lead conversation summary
-- ============================================================

CREATE OR REPLACE FUNCTION get_lead_conversation_summary(p_lead_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT JSONB_BUILD_OBJECT(
    'lead_id', p_lead_id,
    'total_calls', (SELECT COUNT(*) FROM call_recordings WHERE lead_id = p_lead_id),
    'last_call', (SELECT summary FROM call_recordings WHERE lead_id = p_lead_id ORDER BY created_at DESC LIMIT 1),
    'total_messages', (SELECT COUNT(*) FROM chat_messages WHERE lead_id = p_lead_id),
    'last_message', (SELECT content FROM chat_messages WHERE lead_id = p_lead_id ORDER BY created_at DESC LIMIT 1),
    'memory_topics', (SELECT COALESCE(
      (SELECT ARRAY(SELECT DISTINCT unnest(key_topics)) FROM conversation_memory WHERE lead_id = p_lead_id),
      '{}'::TEXT[]
    )),
    'memory_pain_points', (SELECT COALESCE(
      (SELECT ARRAY(SELECT DISTINCT unnest(stated_pain_points)) FROM conversation_memory WHERE lead_id = p_lead_id),
      '{}'::TEXT[]
    )),
    'objections', (SELECT COALESCE(
      (SELECT ARRAY(SELECT DISTINCT jsonb_array_elements(objections_raised)->>'type') FROM conversation_memory WHERE lead_id = p_lead_id),
      '{}'::TEXT[]
    )),
    'channels_used', (SELECT COALESCE(
      (SELECT ARRAY(SELECT DISTINCT channel FROM conversation_memory WHERE lead_id = p_lead_id),
       '{}'::TEXT[])
    ))
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- 10. Helper function — Log call activity to lead_activities
-- ============================================================

CREATE OR REPLACE FUNCTION log_call_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO lead_activities (lead_id, type, description, metadata)
  VALUES (
    NEW.lead_id,
    'call',
    CASE
      WHEN NEW.status = 'completed' THEN 'AI call completed (' || NEW.duration_seconds || 's)'
      WHEN NEW.status = 'voicemail' THEN 'AI left voicemail'
      WHEN NEW.status = 'failed' THEN 'AI call failed'
      WHEN NEW.status = 'busy' THEN 'Line busy — will retry'
      WHEN NEW.status = 'no_answer' THEN 'No answer — will retry'
      WHEN NEW.status = 'scheduled' THEN 'AI call scheduled'
      ELSE 'Call status: ' || NEW.status
    END,
    jsonb_build_object(
      'call_id', NEW.id,
      'duration', NEW.duration_seconds,
      'status', NEW.status,
      'direction', NEW.direction
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_log_call_activity ON call_recordings;
CREATE TRIGGER trg_log_call_activity
  AFTER INSERT ON call_recordings
  FOR EACH ROW
  EXECUTE FUNCTION log_call_activity();
