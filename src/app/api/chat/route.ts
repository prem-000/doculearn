import { NextRequest, NextResponse } from 'next/server';
import { KeyRotator } from '@/lib/key-rotator';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { callOllama } from '@/lib/ollama';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { prompt, deviceId, systemPrompt, history = [] } = await req.json();

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    const rotator = new KeyRotator(deviceId);

    let settings = null;
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('user_settings')
        .select('ollama_url, ollama_model, default_model')
        .eq('user_id', deviceId)
        .single();
      settings = data;
    }

    const maxAttempts = 5; // Fallback limit or count of keys
    let attempt = 0;

    while (attempt < maxAttempts) {
      const key = await rotator.getAvailableKey();

      if (!key) {
        // Fallback to Ollama if configured
        if (settings?.ollama_url && (settings.default_model === 'auto' || settings.default_model === 'ollama')) {
          try {
            const ollamaRes = await callOllama(settings.ollama_url, {
              model: settings.ollama_model || 'llama3:8b',
              messages: [
                { role: 'system', content: systemPrompt || '' },
                ...history,
                { role: 'user', content: prompt }
              ],
              stream: false // For simplicity in this implementation, can be updated to stream
            });
            const data = await ollamaRes.json();
            return NextResponse.json({ 
              content: data.message?.content || data.response,
              model: `Ollama (${settings.ollama_model})`,
              action: 'switched_to_ollama'
            });
          } catch (ollamaErr) {
            console.error('Ollama fallback failed:', ollamaErr);
            return NextResponse.json({ 
              error: 'OLLAMA_UNREACHABLE',
              ollama_url: settings.ollama_url,
              suggestion: 'Check if Ollama is running locally'
            }, { status: 503 });
          }
        }

        return NextResponse.json({ 
          error: 'ALL_KEYS_EXHAUSTED',
          retry_after_seconds: 3600, // Default to 1 hour
          ollama_available: !!settings?.ollama_url
        }, { status: 429 });
      }

      try {
        const genAI = new GoogleGenerativeAI(key.value);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        await rotator.incrementRequestCount(key.index);

        return NextResponse.json({ 
          content: text,
          model: `Gemini (Key ${key.index + 1})`,
          key_index: key.index
        });

      } catch (err: any) {
        const status = err?.status || 500;

        if (status === 429) {
          await rotator.setCooldown(key.index, 60);
          attempt++;
          continue;
        }

        if (status === 401) {
          await rotator.markKeyInvalid(key.index);
          attempt++;
          continue;
        }

        console.error('Gemini API Error:', err);
        return NextResponse.json({ error: 'GEMINI_API_ERROR', details: err.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'ALL_KEYS_FAILED' }, { status: 500 });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'INTERNAL_SERVER_ERROR' }, { status: 500 });
  }
}
