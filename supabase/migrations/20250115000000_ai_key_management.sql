-- 1. Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               TEXT NOT NULL UNIQUE,          -- device/session identifier
  gemini_keys_encrypted TEXT,            -- pgp_sym_encrypt(keys_json, secret)
  ollama_url            TEXT DEFAULT 'http://localhost:11434',
  ollama_model          TEXT DEFAULT 'llama3:8b',
  default_model         TEXT DEFAULT 'auto',
  answering_mode        TEXT DEFAULT 'hybrid',
  use_semantic          BOOLEAN DEFAULT TRUE,
  context_window        INT DEFAULT 1,
  sync_nodes            BOOLEAN DEFAULT FALSE,
  updated_at            TIMESTAMP DEFAULT NOW()
);

-- 3. API Key Usage Table
CREATE TABLE IF NOT EXISTS api_key_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  key_index       INT NOT NULL,
  key_hash        TEXT NOT NULL,
  status          TEXT DEFAULT 'available',
  cooldown_until  TIMESTAMP,
  request_count   INT DEFAULT 0,
  error_count     INT DEFAULT 0,
  last_used       TIMESTAMP DEFAULT NOW(),
  last_error      TEXT,
  UNIQUE(user_id, key_index)
);

-- 4. RPC to decrypt keys
CREATE OR REPLACE FUNCTION get_decrypted_keys(p_user_id TEXT, p_secret TEXT)
RETURNS TEXT AS $$
DECLARE
    decrypted_keys TEXT;
BEGIN
    SELECT pgp_sym_decrypt(gemini_keys_encrypted::bytea, p_secret)
    INTO decrypted_keys
    FROM user_settings
    WHERE user_id = p_user_id;
    
    RETURN decrypted_keys;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC to increment request count
CREATE OR REPLACE FUNCTION increment_key_request_count(p_user_id TEXT, p_key_index INT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO api_key_usage (user_id, key_index, key_hash, request_count, last_used)
    VALUES (p_user_id, p_key_index, 'pending', 1, NOW())
    ON CONFLICT (user_id, key_index)
    DO UPDATE SET 
        request_count = api_key_usage.request_count + 1,
        last_used = NOW(),
        status = 'available';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
