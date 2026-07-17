import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { UserProgress } from './supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mountedRef.current) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!mountedRef.current) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

type ProgressContextType = {
  progress: UserProgress | null;
  completions: string[];
  loadingProgress: boolean;
  refreshProgress: () => Promise<void>;
  completeLesson: (lessonId: string, score: number, accuracy: number) => Promise<number>;
};

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [completions, setCompletions] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const refreshProgress = useCallback(async () => {
    if (!user) {
      setProgress(null);
      setCompletions([]);
      setLoadingProgress(false);
      return;
    }

    const [progressRes, completionsRes] = await Promise.all([
      supabase.from('user_progress').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('lesson_completions').select('lesson_id').eq('user_id', user.id),
    ]);

    if (progressRes.data) {
      setProgress(progressRes.data as UserProgress);
    } else if (!progressRes.error) {
      const { data: newProgress } = await supabase
        .from('user_progress')
        .insert({ user_id: user.id })
        .select('*')
        .single();
      if (newProgress) setProgress(newProgress as UserProgress);
    }

    if (completionsRes.data) {
      setCompletions(completionsRes.data.map((c) => c.lesson_id));
    }
    setLoadingProgress(false);
  }, [user]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  const completeLesson = useCallback(
    async (lessonId: string, score: number, accuracy: number) => {
      if (!user) return 0;

      const xpEarned = Math.round(score * 10 + accuracy * 50);

      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      let newStreak = 1;
      if (progress) {
        if (progress.last_lesson_date === today) {
          newStreak = progress.current_streak;
        } else if (progress.last_lesson_date === yesterday) {
          newStreak = progress.current_streak + 1;
        }
      }

      const newTotalXp = (progress?.total_xp ?? 0) + xpEarned;
      const newLongestStreak = Math.max(progress?.longest_streak ?? 0, newStreak);

      await supabase.from('lesson_completions').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        score,
        xp_earned: xpEarned,
        accuracy,
      }, { onConflict: 'user_id,lesson_id' });

      await supabase.from('user_progress').upsert({
        user_id: user.id,
        total_xp: newTotalXp,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_lesson_date: today,
      }, { onConflict: 'user_id' });

      setProgress((prev) => prev ? {
        ...prev,
        total_xp: newTotalXp,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_lesson_date: today,
      } : prev);
      setCompletions((prev) => prev.includes(lessonId) ? prev : [...prev, lessonId]);

      return xpEarned;
    },
    [user, progress]
  );

  return (
    <ProgressContext.Provider value={{ progress, completions, loadingProgress, refreshProgress, completeLesson }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
