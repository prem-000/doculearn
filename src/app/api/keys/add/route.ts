import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getDeviceId } from '@/lib/device-id';

export async function POST(request: Request) {
  try {
    const { gemini_keys } = await request.json();
    
    // Validate keys format
    if (!Array.isArray(gemini_keys) || gemini_keys.length === 0) {
      return NextResponse.json({ error: 'Invalid keys format' }, { status: 400 });
    }

    // Validate each key format (Gemini keys start with "AIza")
    const invalidKeys = gemini_keys.filter(key => !key.startsWith('AIza'));
    if (invalidKeys.length > 0) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }

    const keysJson = JSON.stringify(gemini_keys);
    const deviceId = request.headers.get('x-device-id') || 'anonymous';
    
    // Encrypt using pgcrypto RPC
    const { data, error } = await supabase.rpc('encrypt_api_keys', {
      p_user_id: deviceId,
      p_keys_json: keysJson
    });

    if (error) {
      console.error('Encryption error:', error);
      return NextResponse.json({ error: 'Failed to save keys' }, { status: 500 });
    }

    return NextResponse.json({ success: true, key_count: gemini_keys.length });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
