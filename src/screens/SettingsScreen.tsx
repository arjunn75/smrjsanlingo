import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { UserSettings } from '../lib/supabase';
import { ArrowLeft, Volume2, Key, Save, Check, ExternalLink, Info } from 'lucide-react';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const [, setSettings] = useState<UserSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [voiceId, setVoiceId] = useState('21m00Tcm4TlvDq8ikWAM');
  const [modelId, setModelId] = useState('eleven_multilingual_v2');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSettings() {
      if (!user) return;
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setSettings(data as UserSettings);
        setApiKey(data.elevenlabs_api_key ?? '');
        setVoiceId(data.tts_voice_id ?? '21m00Tcm4TlvDq8ikWAM');
        setModelId(data.tts_model_id ?? 'eleven_multilingual_v2');
      }
      setLoading(false);
    }
    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('user_settings').upsert({
      user_id: user.id,
      elevenlabs_api_key: apiKey || null,
      tts_voice_id: voiceId,
      tts_model_id: modelId,
    }, { onConflict: 'user_id' });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-saffron-200 border-t-saffron-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-28">
      <div className="sticky top-0 z-30 bg-cream/80 backdrop-blur-xl border-b border-saffron-100/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={onBack} className="shrink-0 group">
            <ArrowLeft className="w-6 h-6 text-saffron-500 group-hover:text-saffron-700 transition-colors" />
          </button>
          <h1 className="font-extrabold text-saffron-900 text-lg">Settings</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* TTS Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-saffron-100/50">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-saffron-100 to-saffron-200/50 flex items-center justify-center">
              <Volume2 className="w-5 h-5 text-saffron-600" />
            </div>
            <div>
              <h2 className="font-bold text-saffron-900">Text-to-Speech</h2>
              <p className="text-xs text-saffron-400">Powered by ElevenLabs</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-saffron-900 mb-2">
                <Key className="w-3.5 h-3.5" />
                ElevenLabs API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your ElevenLabs API key"
                className="w-full px-4 py-3 rounded-xl border-2 border-saffron-100 focus:border-saffron-400 focus:ring-4 focus:ring-saffron-100/50 outline-none transition-all text-saffron-900 placeholder-saffron-300/70"
              />
              <p className="text-xs text-saffron-400 mt-2 flex items-center gap-1">
                Don't have a key?
                <a
                  href="https://elevenlabs.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-saffron-600 font-semibold inline-flex items-center gap-0.5 hover:underline"
                >
                  Get one at elevenlabs.io <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-saffron-900 mb-2">
                Voice ID
              </label>
              <input
                type="text"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                placeholder="21m00Tcm4TlvDq8ikWAM"
                className="w-full px-4 py-3 rounded-xl border-2 border-saffron-100 focus:border-saffron-400 focus:ring-4 focus:ring-saffron-100/50 outline-none transition-all text-saffron-900 placeholder-saffron-300/70"
              />
              <p className="text-xs text-saffron-400 mt-2">
                Default voice: Rachel (21m00Tcm4TlvDq8ikWAM). Find more voices in your ElevenLabs dashboard.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-saffron-900 mb-2">
                Model ID
              </label>
              <select
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-saffron-100 focus:border-saffron-400 focus:ring-4 focus:ring-saffron-100/50 outline-none transition-all text-saffron-900 bg-white"
              >
                <option value="eleven_multilingual_v2">eleven_multilingual_v2 (recommended)</option>
                <option value="eleven_multilingual_v1">eleven_multilingual_v1</option>
                <option value="eleven_turbo_v2_5">eleven_turbo_v2_5 (faster)</option>
                <option value="eleven_turbo_v2">eleven_turbo_v2</option>
              </select>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold text-sm shadow-lg shadow-saffron-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <Check className="w-4 h-4" /> Saved!
                </>
              ) : saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-gradient-to-r from-saffron-50 to-gold-50/50 rounded-2xl p-5 border border-saffron-100/50">
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-saffron-100 flex items-center justify-center">
              <Info className="w-4 h-4 text-saffron-600" />
            </div>
            <p className="text-sm text-saffron-700 font-medium leading-relaxed">
              Your API key is stored securely in your account and is only used to generate
              pronunciation audio for Devanagari letters and Sanskrit phonemes during lessons.
              Without a key, the app works fully — just without audio playback.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
