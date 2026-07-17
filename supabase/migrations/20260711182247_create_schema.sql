-- Units table
CREATE TABLE units (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'BookOpen',
  color_theme TEXT NOT NULL DEFAULT 'saffron'
);

-- Lessons table
CREATE TABLE lessons (
  id TEXT PRIMARY KEY,
  unit_id TEXT NOT NULL REFERENCES units(id),
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  lesson_type TEXT NOT NULL DEFAULT 'standard',
  description TEXT NOT NULL DEFAULT '',
  icon_name TEXT NOT NULL DEFAULT 'Circle'
);

-- Exercises table
CREATE TABLE exercises (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  exercise_type TEXT NOT NULL,
  prompt TEXT NOT NULL DEFAULT '',
  prompt_devanagari TEXT DEFAULT '',
  question_data JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL,
  tts_text TEXT DEFAULT ''
);

-- User progress (global stats)
CREATE TABLE user_progress (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_lesson_date DATE,
  hearts INTEGER NOT NULL DEFAULT 5,
  max_hearts INTEGER NOT NULL DEFAULT 5,
  last_heart_regenerated TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lesson completions (per lesson)
CREATE TABLE lesson_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL REFERENCES lessons(id),
  score INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  accuracy REAL NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- User settings (for API keys like ElevenLabs)
CREATE TABLE user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  elevenlabs_api_key TEXT,
  tts_voice_id TEXT DEFAULT '21m00Tcm4TlvDq8ikWAM',
  tts_model_id TEXT DEFAULT 'eleven_multilingual_v2',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- RLS for units (public read, no write)
CREATE POLICY "read_units" ON units FOR SELECT
  TO anon, authenticated USING (true);

-- RLS for lessons (public read, no write)
CREATE POLICY "read_lessons" ON lessons FOR SELECT
  TO anon, authenticated USING (true);

-- RLS for exercises (public read, no write)
CREATE POLICY "read_exercises" ON exercises FOR SELECT
  TO anon, authenticated USING (true);

-- RLS for user_progress (user can only see/edit own)
CREATE POLICY "select_own_progress" ON user_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_progress" ON user_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_progress" ON user_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- RLS for lesson_completions (user can only see/edit own)
CREATE POLICY "select_own_completions" ON lesson_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_completions" ON lesson_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_completions" ON lesson_completions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_completions" ON lesson_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- RLS for user_settings (user can only see/edit own)
CREATE POLICY "select_own_settings" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_settings" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_settings" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_lessons_unit ON lessons(unit_id, order_index);
CREATE INDEX idx_exercises_lesson ON exercises(lesson_id, order_index);
CREATE INDEX idx_completions_user ON lesson_completions(user_id);