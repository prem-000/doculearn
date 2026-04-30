-- Privacy Compliance Tables
CREATE TABLE IF NOT EXISTS user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,            -- device/session identifier
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, consent_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id);

-- Enable RLS (though project is currently open-access, we follow best practices)
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access based on user_id (device_id)
CREATE POLICY "Allow anonymous users to manage their own consent"
  ON user_consents
  FOR ALL
  USING (TRUE) -- In a real app, we'd check device_id header, but here we allow public for simplicity as requested
  WITH CHECK (TRUE);
