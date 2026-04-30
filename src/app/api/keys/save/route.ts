import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { z } from "zod";

const saveSchema = z.object({
  device_id: z.string().uuid(),
  gemini_keys: z.array(z.string().min(10)),
  ollama_url: z.string().url().optional().default("http://localhost:11434"),
  selected_model: z.string().optional().default("gemini-2.0-flash"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = saveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid data", details: validation.error.errors }, { status: 400 });
    }

    const { device_id, gemini_keys, ollama_url, selected_model } = validation.data;
    const secret = process.env.ENCRYPTION_SECRET;

    if (!secret) {
      return NextResponse.json({ error: "Server encryption secret not configured" }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Encrypt each key using Supabase RPC (pgcrypto)
    const encryptedKeys: string[] = [];
    for (const key of gemini_keys) {
      const { data, error } = await supabaseAdmin.rpc("encrypt_key", {
        plaintext: key,
        secret: secret,
      });

      if (error) throw error;
      encryptedKeys.push(data);
    }

    // Save to user_settings
    const { error: upsertError } = await supabaseAdmin.from("user_settings").upsert({
      device_id,
      gemini_keys_encrypted: encryptedKeys,
      ollama_url,
      selected_model,
      updated_at: new Date().toISOString(),
    });

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, message: "Settings saved and keys encrypted" });
  } catch (err) {
    console.error("Error saving settings:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
