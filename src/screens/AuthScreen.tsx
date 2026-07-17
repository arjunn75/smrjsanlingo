import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { BookOpen, Sparkles, ArrowRight } from 'lucide-react';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = mode === 'signup' ? await signUp(email, password) : await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-parchment to-saffron-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-saffron-200/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-gold-200/20 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-maroon-200/10 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8 animate-bounce-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-saffron-400 via-saffron-500 to-saffron-600 shadow-2xl shadow-saffron-500/30 mb-5 border-2 border-white/20">
            <span className="font-devanagari text-5xl font-bold text-white">सं</span>
          </div>
          <h1 className="text-4xl font-extrabold text-saffron-900 tracking-tight">Sanskrit Path</h1>
          <p className="text-saffron-600 mt-2 text-sm font-medium">
            Learn Sanskrit from the ground up
          </p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-xs font-semibold text-saffron-400 bg-saffron-50 px-2.5 py-1 rounded-full border border-saffron-100">Devanagari</span>
            <span className="text-xs font-semibold text-maroon-400 bg-maroon-50 px-2.5 py-1 rounded-full border border-maroon-100">Shiva Sutras</span>
            <span className="text-xs font-semibold text-gold-600 bg-gold-100 px-2.5 py-1 rounded-full border border-gold-200">Pratyahar</span>
          </div>
        </div>

        <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-saffron-900/10 p-8 border border-saffron-100/50">
          <div className="flex gap-2 mb-6 p-1 bg-saffron-50 rounded-2xl">
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === 'signup'
                  ? 'bg-white text-saffron-700 shadow-sm'
                  : 'text-saffron-400 hover:text-saffron-600'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                mode === 'signin'
                  ? 'bg-white text-saffron-700 shadow-sm'
                  : 'text-saffron-400 hover:text-saffron-600'
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-saffron-900 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-saffron-100 focus:border-saffron-400 focus:ring-4 focus:ring-saffron-100/50 outline-none transition-all text-saffron-900 placeholder-saffron-300/70"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-saffron-900 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-saffron-100 focus:border-saffron-400 focus:ring-4 focus:ring-saffron-100/50 outline-none transition-all text-saffron-900 placeholder-saffron-300/70"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <div className="bg-error-50 text-error-700 text-sm font-medium px-4 py-3 rounded-xl animate-shake border border-error-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold text-sm shadow-lg shadow-saffron-500/30 hover:shadow-xl hover:shadow-saffron-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-3 text-xs text-saffron-400">
            <div className="flex-1 h-px bg-saffron-100" />
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Progress saved across devices
            </span>
            <div className="flex-1 h-px bg-saffron-100" />
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-saffron-400 flex items-center justify-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5" />
          Master the language of the Vedas
        </p>
      </div>
    </div>
  );
}
