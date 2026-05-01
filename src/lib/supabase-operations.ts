import { supabase } from './supabase-client';

export async function getUserSettings(deviceId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', deviceId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserSettings(deviceId: string, settings: Record<string, any>) {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({ user_id: deviceId, ...settings, updated_at: new Date().toISOString() })
    .select();

  if (error) throw error;
  return data;
}

export async function saveEncryptedKeys(deviceId: string, keys: string[]) {
  const { error } = await supabase.rpc('encrypt_api_keys', {
    p_user_id: deviceId,
    p_keys_json: JSON.stringify(keys),
  });

  if (error) throw error;

  // Also initialize key usage entries
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    // In a real app, we'd hash the key before storing
    const keyHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))
      .then(hash => Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join(''));

    await supabase.from('api_key_usage').upsert({
      user_id: deviceId,
      key_index: i,
      key_hash: keyHash,
      status: 'available',
    }, { onConflict: 'user_id,key_index' });
  }
}

export async function getApiKeyUsage(deviceId: string) {
  const { data, error } = await supabase
    .from('api_key_usage')
    .select('*')
    .eq('user_id', deviceId)
    .order('key_index', { ascending: true });

  if (error) throw error;
  return data;
}
