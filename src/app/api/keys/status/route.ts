import { NextResponse } from 'next/server';

// This would typically fetch from Supabase 'api_key_usage' table
// For now, we'll return a mock response based on the specification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('device_id');

  if (!deviceId) {
    return NextResponse.json({ error: 'DEVICE_ID_REQUIRED' }, { status: 400 });
  }

  // Mock data for Week 1
  return NextResponse.json({
    keys: [
      {
        key_index: 0,
        key_hash: "sha256_e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        status: "available",
        cooldown_until: null,
        request_count: 0,
        last_used: new Date().toISOString()
      }
    ],
    ollama_status: "available",
    recommended_key: 0
  });
}
