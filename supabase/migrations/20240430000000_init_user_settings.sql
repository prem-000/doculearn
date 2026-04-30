-- Enable pgcrypto for symmetric encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL, -- Anonymous identifier for the device/session
  gemini_keys_encrypted TEXT,     -- Encrypted JSON array of keys
  ollama_url TEXT DEFAULT 'http://localhost:11434',
  cloud_sync_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (no auth required for V1)
-- In a real app, we might want to restrict this, but for open access:
CREATE POLICY "Allow public insert" ON public.user_settings
  FOR INSERT WITH CHECK (true);

-- Policy: Allow users to select/update their own data via device_id
-- We'll use a header or cookie for device_id
CREATE POLICY "Allow access via device_id" ON public.user_settings
  FOR ALL USING (true); -- Simplified for now, will refine with device_id logic

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
