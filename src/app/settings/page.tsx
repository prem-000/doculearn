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
      <div className="flex flex-col h-full items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-background text-foreground px-4 pb-24 pt-6 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center gap-3 mb-8 mt-4"
      >
        <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
          <Settings className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">Configure your AI models and privacy preferences</p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-6 w-full max-w-md mx-auto">
        {/* AI Configuration */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass p-5 rounded-3xl border border-white/5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold">AI Models</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Gemini API Keys
              </label>
              <input
                type="password"
                placeholder="AIza..."
                value={geminiKeys}
                onChange={(e) => setGeminiKeys(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <Shield className="w-3 h-3 text-indigo-400" />
                Encrypted and never stored in plain text.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Ollama Base URL
              </label>
              <input
                type="text"
                placeholder="http://localhost:11434"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
                Ollama Model
              </label>
              <input
                type="text"
                placeholder="llama3:8b"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
              />
            </div>
          </div>
        </motion.div>

        {/* Privacy & Cloud */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass p-5 rounded-3xl border border-white/5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Cloud className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-bold">Cloud Sync</h2>
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/10">
            <div>
              <h3 className="text-sm font-bold">Enable Cloud Sync</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Sync Doubt Graph across devices</p>
            </div>
            <button
              onClick={() => setSyncEnabled(!syncEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${syncEnabled ? 'bg-indigo-500' : 'bg-white/10'}`}
            >
              <motion.div
                animate={{ x: syncEnabled ? 26 : 2 }}
                className="absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>

          <div className="mt-4 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex gap-2">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-200/80 leading-relaxed">
              Cloud sync stores Q&As on our servers. Your documents NEVER leave your device.
            </p>
          </div>
        </motion.div>

        {/* Floating Save Button */}
        <div className="fixed bottom-6 left-0 right-0 px-4 z-40 flex justify-center pointer-events-none">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full max-w-[250px] bg-indigo-600 text-white py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-2xl shadow-indigo-600/40 disabled:opacity-50 pointer-events-auto"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
  );
}
