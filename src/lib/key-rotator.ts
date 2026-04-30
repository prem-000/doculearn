import { supabaseAdmin } from './supabase';
import crypto from 'crypto';

export interface GeminiKey {
  index: number;
  value: string;
}

export interface KeyUsage {
  key_index: number;
  status: 'available' | 'cooldown' | 'invalid';
  cooldown_until: string | null;
}

export class KeyRotator {
  private userId: string;
  private appSecret: string;
  private static sessionInvalidKeys = new Set<string>(); // Global across instances for this session
  private static sessionCooldowns = new Map<number, Date>();

  constructor(userId: string) {
    this.userId = userId;
    this.appSecret = process.env.APP_SECRET || 'default-secret';
  }

  private async getKeys(): Promise<GeminiKey[]> {
    // 1. Check environment variables first (as requested by user for chaining)
    const envKeysStr = process.env.GEMINI_API_KEYS;
    if (envKeysStr) {
      const envKeys = envKeysStr.split(',').map(k => k.trim()).filter(Boolean);
      if (envKeys.length > 0) {
        return envKeys.map((value, index) => ({ index, value }));
      }
    }

    // 2. Fallback to Supabase if no env keys are found
    if (!supabaseAdmin) {
      console.warn('Supabase admin not initialized and no GEMINI_API_KEYS found in .env');
      return [];
    }

    const { data, error } = await supabaseAdmin.rpc('get_decrypted_keys', {
      p_user_id: this.userId,
      p_secret: this.appSecret
    });

    if (error) {
      console.error('Error fetching keys from database:', error);
      return [];
    }

    try {
      const keysJson = typeof data === 'string' ? JSON.parse(data) : data;
      return keysJson.map((value: string, index: number) => ({ index, value }));
    } catch (e) {
      console.error('Error parsing keys JSON from database:', e);
      return [];
    }
  }

  private async getCooldowns(): Promise<Record<number, Date>> {
    const cooldowns: Record<number, Date> = {};
    
    // Add session-based cooldowns first
    KeyRotator.sessionCooldowns.forEach((date, index) => {
      cooldowns[index] = date;
    });

    if (!supabaseAdmin) return cooldowns;

    const { data, error } = await supabaseAdmin
      .from('api_key_usage')
      .select('key_index, cooldown_until')
      .eq('user_id', this.userId);

    if (error) {
      console.error('Error fetching cooldowns:', error);
      return cooldowns;
    }

    data.forEach((item) => {
      if (item.cooldown_until) {
        cooldowns[item.key_index] = new Date(item.cooldown_until);
      }
    });
    return cooldowns;
  }

  async getAvailableKey(): Promise<GeminiKey | null> {
    const keys = await this.getKeys();
    if (keys.length === 0) return null;

    const cooldowns = await this.getCooldowns();
    const now = new Date();

    for (const key of keys) {
      // Skip if marked invalid in this session
      if (KeyRotator.sessionInvalidKeys.has(key.value)) continue;

      const cooldownUntil = cooldowns[key.index];
      if (!cooldownUntil || cooldownUntil < now) {
        return key;
      }
    }
    return null;
  }

  async setCooldown(keyIndex: number, minutes: number = 60) {
    const cooldownUntil = new Date(Date.now() + minutes * 60 * 1000);
    KeyRotator.sessionCooldowns.set(keyIndex, cooldownUntil);

    if (!supabaseAdmin) return;

    const { error } = await supabaseAdmin
      .from('api_key_usage')
      .upsert({
        user_id: this.userId,
        key_index: keyIndex,
        status: 'cooldown',
        cooldown_until: cooldownUntil.toISOString(),
      }, { onConflict: 'user_id,key_index' });

    if (error) console.error('Error setting cooldown:', error);
  }

  async markKeyInvalid(keyIndex: number) {
    const keys = await this.getKeys();
    const key = keys.find(k => k.index === keyIndex);
    if (key) {
      KeyRotator.sessionInvalidKeys.add(key.value);
    }

    if (!supabaseAdmin) return;

    const { error } = await supabaseAdmin
      .from('api_key_usage')
      .upsert({
        user_id: this.userId,
        key_index: keyIndex,
        status: 'invalid',
      }, { onConflict: 'user_id,key_index' });

    if (error) console.error('Error marking key invalid:', error);
  }

  async incrementRequestCount(keyIndex: number) {
    if (!supabaseAdmin) return;

    const { error } = await supabaseAdmin.rpc('increment_key_request_count', {
      p_user_id: this.userId,
      p_key_index: keyIndex
    });

    if (error) console.error('Error incrementing request count:', error);
  }

  static hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }
}
