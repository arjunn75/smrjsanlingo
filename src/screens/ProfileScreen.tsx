import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, useProgress } from '../lib/auth';
import type { Unit, Lesson } from '../lib/supabase';
import { Flame, Star, Trophy, BookOpen, Target, LogOut, ChevronRight, Award } from 'lucide-react';

export function ProfileScreen({ onNavigate }: { onNavigate: (screen: 'path' | 'settings') => void }) {
  const { user, signOut } = useAuth();
  const { progress, completions } = useProgress();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    async function fetchData() {
      const [unitsRes, lessonsRes] = await Promise.all([
        supabase.from('units').select('*').order('order_index'),
        supabase.from('lessons').select('*').order('order_index'),
      ]);
      setUnits(unitsRes.data ?? []);
      setLessons(lessonsRes.data ?? []);
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-cream pb-28">
      <div className="sticky top-0 z-30 bg-cream/80 backdrop-blur-xl border-b border-saffron-100/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-extrabold text-saffron-900 text-lg">Profile</h1>
          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-sm font-semibold text-saffron-500 hover:text-saffron-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        {/* User card */}
        <div className="bg-gradient-to-br from-saffron-500 via-saffron-600 to-saffron-700 rounded-3xl p-6 shadow-xl shadow-saffron-500/20 mb-6 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-white/5 blur-lg" />
          <div className="relative flex items-center gap-4">
            <div className="w-18 h-18 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-extrabold text-white w-16 h-16 border-2 border-white/20">
              {(user?.email ?? 'U')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-white font-bold text-lg">{user?.email}</p>
              <p className="text-white/70 text-sm">Sanskrit Learner</p>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={<Flame className="w-5 h-5 text-saffron-500" />}
            label="Current Streak"
            value={`${progress?.current_streak ?? 0} days`}
            color="saffron"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-gold-500" />}
            label="Longest Streak"
            value={`${progress?.longest_streak ?? 0} days`}
            color="gold"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-gold-500" />}
            label="Total XP"
            value={`${progress?.total_xp ?? 0}`}
            color="gold"
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-maroon-500" />}
            label="Lessons Done"
            value={`${completions.length}`}
            color="maroon"
          />
        </div>

        {/* Unit progress */}
        <h2 className="text-xs font-bold text-saffron-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" />
          Unit Progress
        </h2>
        <div className="space-y-3 mb-6">
          {units.map((unit) => {
            const unitLessons = lessons.filter((l) => l.unit_id === unit.id);
            const completedCount = unitLessons.filter((l) => completions.includes(l.id)).length;
            const unitProgress = Math.round((completedCount / unitLessons.length) * 100);
            const isMaroon = unit.color_theme === 'maroon';

            return (
              <div key={unit.id} className="bg-white rounded-2xl p-4 shadow-sm border border-saffron-100/50 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isMaroon ? 'bg-maroon-50' : 'bg-saffron-50'
                    }`}>
                      {unit.icon_name === 'PenTool' && <span className="font-devanagari text-base font-bold text-saffron-600">क</span>}
                      {unit.icon_name === 'Scroll' && <span className="font-devanagari text-base font-bold text-maroon-600">सू</span>}
                    </div>
                    <div>
                      <p className="font-bold text-saffron-900 text-sm">{unit.title}</p>
                      <p className="text-xs text-saffron-400">{completedCount}/{unitLessons.length} lessons</p>
                    </div>
                  </div>
                  <div className={`text-2xl font-extrabold ${isMaroon ? 'text-maroon-600' : 'text-saffron-600'} tabular-nums`}>
                    {unitProgress}%
                  </div>
                </div>
                <div className="h-2 bg-saffron-50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isMaroon
                        ? 'bg-gradient-to-r from-maroon-400 to-maroon-600'
                        : 'bg-gradient-to-r from-saffron-400 to-saffron-600'
                    }`}
                    style={{ width: `${unitProgress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Settings link */}
        <button
          onClick={() => onNavigate('settings')}
          className="w-full bg-white rounded-2xl p-4 shadow-sm border border-saffron-100/50 flex items-center justify-between hover:border-saffron-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-saffron-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-saffron-600" />
            </div>
            <div className="text-left">
              <p className="font-bold text-saffron-900 text-sm">Settings</p>
              <p className="text-xs text-saffron-400">TTS voice, API key</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-saffron-300" />
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'saffron' | 'gold' | 'maroon';
}) {
  const bgClass = {
    saffron: 'bg-saffron-50',
    gold: 'bg-gold-100',
    maroon: 'bg-maroon-50',
  }[color];

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-saffron-100/50 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center mb-2.5`}>
        {icon}
      </div>
      <p className="text-xs font-semibold text-saffron-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-extrabold text-saffron-900 mt-0.5 tabular-nums">{value}</p>
    </div>
  );
}
