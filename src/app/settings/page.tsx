'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Cpu, Cloud, Save, AlertCircle } from 'lucide-react';
import { getDeviceId } from '@/lib/device-id';
import { supabase } from '@/lib/supabase-client';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [geminiKeys, setGeminiKeys] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3:8b');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const deviceId = getDeviceId();
        const { data } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', deviceId)
          .single();

        if (data) {
          setOllamaUrl(data.ollama_url || 'http://localhost:11434');
          setOllamaModel(data.ollama_model || 'llama3:8b');
          setSyncEnabled(data.sync_nodes || false);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const deviceId = getDeviceId();
      
      // Save keys via API route for encryption
      if (geminiKeys) {
        const keysArray = geminiKeys.split(',').map(k => k.trim()).filter(k => k);
        const res = await fetch('/api/keys/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gemini_keys: keysArray }),
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to save API keys');
        }
      }

      // Save other settings
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: deviceId,
          ollama_url: ollamaUrl,
          ollama_model: ollamaModel,
          sync_nodes: syncEnabled,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      toast.success('Settings saved successfully');
      setGeminiKeys(''); // Clear the input after saving
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-12"
        >
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
            <Settings className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Settings</h1>
            <p className="text-gray-400 mt-1">Configure your AI models and privacy preferences</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI Configuration */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Cpu className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold">AI Models</h2>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Gemini API Keys (Comma separated)
                </label>
                <input
                  type="password"
                  placeholder="AIza..."
                  value={geminiKeys}
                  onChange={(e) => setGeminiKeys(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Keys are encrypted and never stored in plain text.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Ollama Base URL
                </label>
                <input
                  type="text"
                  placeholder="http://localhost:11434"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Ollama Model
                </label>
                <input
                  type="text"
                  placeholder="llama3:8b"
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>
            </div>
          </motion.div>

          {/* Privacy & Cloud */}
          <div className="space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Cloud className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold">Cloud Sync</h2>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div>
                  <h3 className="font-medium">Enable Cloud Sync</h3>
                  <p className="text-sm text-gray-400">Sync your Doubt Graph across devices</p>
                </div>
                <button
                  onClick={() => setSyncEnabled(!syncEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${syncEnabled ? 'bg-blue-500' : 'bg-white/10'}`}
                >
                  <motion.div
                    animate={{ x: syncEnabled ? 26 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                  />
                </button>
              </div>

              <div className="mt-6 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Cloud sync stores your questions and AI answers on Supabase. Your documents NEVER leave your device.
                </p>
              </div>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="w-full premium-gradient py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {saving ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
