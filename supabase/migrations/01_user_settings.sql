-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User settings table
-- Note: device_id is generated client-side and stored in localStorage
CREATE TABLE IF NOT EXISTS public.user_settings (
    device_id UUID PRIMARY KEY,
    gemini_keys_encrypted TEXT[], -- Array of encrypted Gemini keys
    ollama_url TEXT DEFAULT 'http://localhost:11434',
    selected_model TEXT DEFAULT 'gemini-1.5-flash',
    encryption_test_hash TEXT, -- To verify if the secret is correct
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access based on device_id
-- In a real app, we might use a more secure way to verify device_id, 
-- but for open access, we'll allow insert/select/update if device_id is provided.
CREATE POLICY "Allow anonymous read by device_id" ON public.user_settings
    FOR SELECT USING (true); -- Filtered by device_id in queries

CREATE POLICY "Allow anonymous insert" ON public.user_settings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous update by device_id" ON public.user_settings
    FOR UPDATE USING (true);

-- Function to handle encryption/decryption on the server
-- These will be used via RPC or server-side Supabase client
CREATE OR REPLACE FUNCTION encrypt_key(plaintext TEXT, secret TEXT) 
RETURNS TEXT AS $$
    SELECT pgp_sym_encrypt(plaintext, secret)::TEXT;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION decrypt_key(encrypted TEXT, secret TEXT) 
RETURNS TEXT AS $$
    SELECT pgp_sym_decrypt(encrypted::BYTEA, secret);
$$ LANGUAGE SQL;
