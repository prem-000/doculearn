import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export async function POST(request: Request) {
  try {
    const { gemini_keys } = await request.json();
    
    // Validate keys format
    if (!Array.isArray(gemini_keys) || gemini_keys.length === 0) {
      return NextResponse.json({ error: 'Invalid keys format' }, { status: 400 });
    }

    // Validate each key format (Gemini keys start with "AIza")
    const invalidKeys = (gemini_keys as string[]).filter(key => !key.startsWith('AIza'));
    if (invalidKeys.length > 0) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
    }

    const keysJson = JSON.stringify(gemini_keys);
    const deviceId = request.headers.get('x-device-id') || 'anonymous';
    
    // Encrypt using pgcrypto RPC
    const { error } = await supabase.rpc('encrypt_api_keys', {
      p_user_id: deviceId,
      p_keys_json: keysJson
    });

    if (error) {
      console.error('Encryption error:', error);
      return NextResponse.json({ error: 'Failed to save keys' }, { status: 500 });
    }

    return NextResponse.json({ success: true, key_count: (gemini_keys as string[]).length });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
