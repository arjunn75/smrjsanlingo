import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useProgress } from '../lib/auth';
import type { Unit, Lesson } from '../lib/supabase';
import {
  Circle, Star, Trophy, Lock, CheckCircle2,
  Play, PenTool, Scroll, Flame,
} from 'lucide-react';

export function LearningPathScreen({
  onStartLesson,
}: {
  onStartLesson: (lessonId: string) => void;
}) {
  const { progress, completions, loadingProgress } = useProgress();
  const [units, setUnits] = useState<Unit[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [unitsRes, lessonsRes] = await Promise.all([
        supabase.from('units').select('*').order('order_index'),
        supabase.from('lessons').select('*').order('order_index'),
      ]);
      setUnits(unitsRes.data ?? []);
      setLessons(lessonsRes.data ?? []);
      setLoading(false);
    }
    fetchData();
  }, []);

  const getLessonStatus = (lesson: Lesson, allLessons: Lesson[], completed: string[]) => {
    if (completed.includes(lesson.id)) return 'completed';
    const lessonIndex = allLessons.findIndex((l) => l.id === lesson.id);
    if (lessonIndex === 0) return 'available';
    const prevLesson = allLessons[lessonIndex - 1];
    if (completed.includes(prevLesson.id)) return 'available';
    return 'locked';
  };

  const getFirstAvailableLessonId = () => {
    for (const unit of units) {
      const unitLessons = lessons.filter((l) => l.unit_id === unit.id);
      for (const lesson of unitLessons) {
        if (getLessonStatus(lesson, lessons, completions) !== 'locked') {
          return lesson.id;
        }
      }
    }
    return null;
  };

  const firstAvailable = getFirstAvailableLessonId();

  if (loading || loadingProgress) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-saffron-200 border-t-saffron-500 animate-spin mx-auto mb-4" />
          <p className="text-saffron-600 font-medium">Loading your path...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-cream/80 backdrop-blur-xl border-b border-saffron-100/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center shadow-md shadow-saffron-300">
              <span className="font-devanagari text-xl font-bold text-white">सं</span>
            </div>
            <span className="font-extrabold text-saffron-900 text-lg tracking-tight">Sanskrit Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-saffron-50 to-saffron-100/50 px-3 py-1.5 rounded-full border border-saffron-200/50">
              <Flame className="w-4 h-4 text-saffron-500 fill-saffron-400" />
              <span className="font-bold text-saffron-700 text-sm">{progress?.current_streak ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-gold-100 to-gold-200/50 px-3 py-1.5 rounded-full border border-gold-300/50">
              <Star className="w-4 h-4 text-gold-600 fill-gold-500" />
              <span className="font-bold text-gold-700 text-sm">{progress?.total_xp ?? 0}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-maroon-50 to-maroon-100/50 px-3 py-1.5 rounded-full border border-maroon-200/50">
              <span className="text-sm">❤️</span>
              <span className="font-bold text-maroon-600 text-sm">{progress?.hearts ?? 5}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Continue Banner */}
      {firstAvailable && (
        <div className="max-w-2xl mx-auto px-4 pt-5">
          <button
            onClick={() => onStartLesson(firstAvailable)}
            className="w-full bg-gradient-to-r from-saffron-500 via-saffron-600 to-saffron-700 rounded-3xl p-5 flex items-center justify-between text-white shadow-xl shadow-saffron-500/25 hover:shadow-2xl hover:shadow-saffron-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            <div className="text-left">
              <p className="text-xs font-bold text-saffron-100 uppercase tracking-wider mb-1">
                {completions.length > 0 ? 'Continue Learning' : 'Start Your Journey'}
              </p>
              <p className="font-bold text-lg">
                {(() => {
                  const lesson = lessons.find((l) => l.id === firstAvailable);
                  return lesson?.title ?? 'Begin';
                })()}
              </p>
              <p className="text-xs text-saffron-200 mt-0.5">
                {(() => {
                  const lesson = lessons.find((l) => l.id === firstAvailable);
                  return lesson?.description ?? '';
                })()}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 ml-3">
              <Play className="w-6 h-6 fill-white text-white" />
            </div>
          </button>
        </div>
      )}

      {/* Units and Lessons */}
      <div className="max-w-2xl mx-auto px-4 mt-8 space-y-8">
        {units.map((unit) => {
          const unitLessons = lessons.filter((l) => l.unit_id === unit.id);
          const completedCount = unitLessons.filter((l) => completions.includes(l.id)).length;
          const unitProgress = Math.round((completedCount / unitLessons.length) * 100);
          const isMaroon = unit.color_theme === 'maroon';

          return (
            <div key={unit.id}>
              {/* Unit Banner */}
              <div
                className={`rounded-3xl p-6 mb-6 relative overflow-hidden ${
                  isMaroon
                    ? 'bg-gradient-to-br from-maroon-600 via-maroon-700 to-maroon-900'
                    : 'bg-gradient-to-br from-saffron-500 via-saffron-600 to-saffron-700'
                } shadow-xl`}
              >
                {/* Decorative pattern */}
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 blur-xl" />
                <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-white/5 blur-lg" />

                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                        {unit.icon_name === 'PenTool' && <PenTool className="w-4 h-4 text-white" />}
                        {unit.icon_name === 'Scroll' && <Scroll className="w-4 h-4 text-white" />}
                      </div>
                      <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
                        Unit {unit.order_index}
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-white leading-tight">{unit.title}</h2>
                    <p className="text-sm text-white/75 mt-1 leading-relaxed">{unit.description}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-3xl font-extrabold text-white tabular-nums">{unitProgress}%</div>
                    <div className="text-xs text-white/50 font-medium">{completedCount}/{unitLessons.length} done</div>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-white/15 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/90 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${unitProgress}%` }}
                  />
                </div>
              </div>

              {/* Lesson Path */}
              <div className="relative">
                <div className="relative space-y-7 py-2">
                  {unitLessons.map((lesson, idx) => {
                    const status = getLessonStatus(lesson, lessons, completions);
                    const offset = idx % 4;
                    const marginLeft = ['0%', '18%', '0%', '-18%'][offset];

                    return (
                      <div
                        key={lesson.id}
                        className="flex flex-col items-center transition-all animate-fade-in"
                        style={{ marginLeft, animationDelay: `${idx * 60}ms` }}
                      >
                        <LessonNode
                          lesson={lesson}
                          status={status}
                          isCurrent={lesson.id === firstAvailable}
                          isMaroon={isMaroon}
                          onClick={() => status !== 'locked' && onStartLesson(lesson.id)}
                        />
                        <div className="mt-2.5 text-center">
                          <p className={`text-sm font-semibold ${
                            status === 'completed' ? 'text-success-600' :
                            status === 'available' ? (isMaroon ? 'text-maroon-700' : 'text-saffron-700') :
                            'text-saffron-300/70'
                          }`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-saffron-400/80 mt-0.5 max-w-[220px] leading-relaxed">{lesson.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LessonNode({
  lesson,
  status,
  isCurrent,
  isMaroon,
  onClick,
}: {
  lesson: Lesson;
  status: 'completed' | 'available' | 'locked';
  isCurrent: boolean;
  isMaroon: boolean;
  onClick: () => void;
}) {
  if (status === 'locked') {
    return (
      <button
        disabled
        className="w-16 h-16 rounded-full bg-saffron-50 border-2 border-saffron-100 flex items-center justify-center shadow-sm"
      >
        <Lock className="w-6 h-6 text-saffron-300" />
      </button>
    );
  }

  if (lesson.icon_name === 'Trophy') {
    return (
      <button
        onClick={onClick}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-gold-500 flex items-center justify-center shadow-xl shadow-gold-400/40 hover:scale-110 active:scale-95 transition-all border-2 border-white/30"
      >
        <Trophy className="w-7 h-7 text-white fill-white/30" />
      </button>
    );
  }

  const gradientClass = isMaroon
    ? 'bg-gradient-to-br from-maroon-400 to-maroon-600 shadow-maroon-400/40'
    : 'bg-gradient-to-br from-saffron-400 to-saffron-600 shadow-saffron-400/40';

  return (
    <button
      onClick={onClick}
      className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 border-2 border-white/20 ${gradientClass} ${
        isCurrent ? 'animate-pulse-ring' : ''
      }`}
    >
      {status === 'completed' ? (
        <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={2.5} />
      ) : (
        <Circle className="w-8 h-8 text-white fill-white/15" strokeWidth={2.5} />
      )}
      {isCurrent && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-saffron-700 bg-white px-2.5 py-1 rounded-full shadow-md whitespace-nowrap border border-saffron-200">
          Start
        </span>
      )}
    </button>
  );
}
