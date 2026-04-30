-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. User Settings
CREATE TABLE IF NOT EXISTS user_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL UNIQUE,          -- device/session identifier
  gemini_keys_encrypted BYTEA,                         -- pgp_sym_encrypt output is bytea
  ollama_url            TEXT,
  ollama_model          TEXT DEFAULT 'llama3:8b',
  default_model         TEXT DEFAULT 'auto',
  answering_mode        TEXT DEFAULT 'hybrid',
  use_semantic          BOOLEAN DEFAULT TRUE,
  context_window        INT DEFAULT 1,   -- N±1 pages
  sync_nodes            BOOLEAN DEFAULT FALSE,
  updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. API Key Usage
CREATE TABLE IF NOT EXISTS api_key_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,           -- device/session identifier
  key_index       INT NOT NULL,
  key_hash        TEXT NOT NULL,         -- sha256(key)
  status          TEXT DEFAULT 'available',
  cooldown_until  TIMESTAMP WITH TIME ZONE,
  request_count   INT DEFAULT 0,
  error_count     INT DEFAULT 0,
  last_used       TIMESTAMP WITH TIME ZONE,
  last_error      TEXT
);

-- 3. Node Graph (Cloud Sync)
CREATE TABLE IF NOT EXISTS node_graph_sync (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,           -- device/session identifier
  node_id          UUID NOT NULL,
  parent_id        UUID,
  doc_id           TEXT NOT NULL,
  doc_name         TEXT,
  page_number      INT,
  question         TEXT NOT NULL,
  answer           TEXT,
  confidence_score FLOAT,
  confidence_level TEXT,
  model_used       TEXT,
  depth            INT DEFAULT 0,
  tokens_used      INT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at     TIMESTAMP WITH TIME ZONE
);

-- 4. Chat Sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,           -- device/session identifier
  doc_name    TEXT,
  doc_hash    TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Messages
CREATE TABLE IF NOT EXISTS messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role          TEXT NOT NULL,         -- 'user' | 'assistant'
  content       TEXT NOT NULL,
  page_at_time  INT,
  model_used    TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Memory System
CREATE TABLE IF NOT EXISTS user_memory (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL,           -- device/session identifier
  topic             TEXT NOT NULL,
  doc_id            TEXT,
  doc_name          TEXT,
  question_count    INT DEFAULT 0,
  avg_confidence    FLOAT DEFAULT 0.5,
  topic_score       FLOAT DEFAULT 0.5,
  last_asked        TIMESTAMP WITH TIME ZONE,
  revision_flag     BOOLEAN DEFAULT FALSE
);

-- 7. Security Logs
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,      -- device/session identifier
  event_type TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_user_id ON api_key_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_node_graph_sync_user_id ON node_graph_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_node_graph_sync_doc_id ON node_graph_sync(doc_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp DESC);

-- Encryption Functions
CREATE OR REPLACE FUNCTION encrypt_api_keys(
  p_user_id TEXT,
  p_keys_json TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_settings (user_id, gemini_keys_encrypted, updated_at)
  VALUES (
    p_user_id,
    pgp_sym_encrypt(p_keys_json, current_setting('app.encryption_secret')),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    gemini_keys_encrypted = pgp_sym_encrypt(p_keys_json, current_setting('app.encryption_secret')),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_api_keys(p_user_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_decrypted_keys TEXT;
BEGIN
  SELECT pgp_sym_decrypt(
    gemini_keys_encrypted,
    current_setting('app.encryption_secret')
  )
  INTO v_decrypted_keys
  FROM user_settings
  WHERE user_settings.user_id = p_user_id;
  
  RETURN v_decrypted_keys;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
