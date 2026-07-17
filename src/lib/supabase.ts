import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Unit = {
  id: string;
  title: string;
  description: string;
  order_index: number;
  icon_name: string;
  color_theme: string;
};

export type Lesson = {
  id: string;
  unit_id: string;
  title: string;
  order_index: number;
  lesson_type: string;
  description: string;
  icon_name: string;
};

export type Exercise = {
  id: string;
  lesson_id: string;
  exercise_type: string;
  prompt: string;
  prompt_devanagari: string | null;
  question_data: {
    options?: string[];
    correct_answer?: string;
    transliteration?: string;
    pairs?: { left: string; right: string }[];
    correct_order?: string[];
    title?: string;
    subtitle?: string;
    body?: string;
    devanagari_examples?: string[];
    transliteration_examples?: string[];
    table_headers?: string[];
    table_rows?: string[][];
    tip?: string;
  };
  order_index: number;
  tts_text: string;
};

export type UserProgress = {
  user_id: string;
  total_xp: number;
  current_streak: number;
  longest_streak: number;
  last_lesson_date: string | null;
  hearts: number;
  max_hearts: number;
  last_heart_regenerated: string | null;
};

export type LessonCompletion = {
  id: string;
  user_id: string;
  lesson_id: string;
  score: number;
  xp_earned: number;
  accuracy: number;
  completed_at: string;
};

export type UserSettings = {
  user_id: string;
  elevenlabs_api_key: string | null;
  tts_voice_id: string;
  tts_model_id: string;
};
