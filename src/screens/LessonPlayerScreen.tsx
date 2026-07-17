import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useProgress } from '../lib/auth';
import type { Exercise } from '../lib/supabase';
import {
  X, Check, Volume2, ArrowRight,
  Trophy, Heart, BookOpen, Lightbulb,
  Sparkles, Star, Zap,
} from 'lucide-react';

type ExerciseResult = 'correct' | 'incorrect' | null;

export function LessonPlayerScreen({
  lessonId,
  onExit,
  onComplete,
}: {
  lessonId: string;
  onExit: () => void;
  onComplete: (score: number, accuracy: number, xpEarned: number) => void;
}) {
  const { completeLesson } = useProgress();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ExerciseResult>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);

  useEffect(() => {
    async function fetchExercises() {
      const { data } = await supabase
        .from('exercises')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('order_index');
      setExercises(data ?? []);
      setLoading(false);
    }
    fetchExercises();
  }, [lessonId]);

  const currentExercise = exercises[currentIndex];
  const isInfoSlide = currentExercise?.exercise_type === 'info';
  const progress = exercises.length > 0 ? (currentIndex / exercises.length) * 100 : 0;

  const handleAnswer = useCallback((isCorrect: boolean) => {
    setResult((prev) => {
      if (prev !== null) return prev;
      if (isCorrect) setCorrectCount((c) => c + 1);
      else setWrongCount((w) => w + 1);
      return isCorrect ? 'correct' : 'incorrect';
    });
  }, []);

  const handleNext = useCallback(async () => {
    if (currentIndex + 1 >= exercises.length) {
      const totalAssessed = exercises.filter((e) => e.exercise_type !== 'info').length;
      const accuracy = totalAssessed > 0 ? correctCount / totalAssessed : 1;
      const score = correctCount;
      const xp = await completeLesson(lessonId, score, accuracy);
      setXpEarned(xp);
      setShowResults(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setResult(null);
    }
  }, [currentIndex, exercises.length, correctCount, completeLesson, lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-saffron-200 border-t-saffron-500 animate-spin" />
      </div>
    );
  }

  if (showResults) {
    const totalAssessed = exercises.filter((e) => e.exercise_type !== 'info').length;
    const accuracy = totalAssessed > 0 ? Math.round((correctCount / totalAssessed) * 100) : 100;
    return (
      <LessonCompleteScreen
        correctCount={correctCount}
        totalCount={totalAssessed}
        accuracy={accuracy}
        xpEarned={xpEarned}
        onContinue={() => onComplete(correctCount, accuracy, xpEarned)}
      />
    );
  }

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-saffron-600 font-medium mb-4">No exercises found for this lesson.</p>
          <button onClick={onExit} className="px-6 py-2 bg-saffron-500 text-white rounded-xl font-semibold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <div className="px-4 py-3 flex items-center gap-3 max-w-2xl mx-auto w-full">
        {confirmExit ? (
          <div className="flex-1 flex items-center justify-between bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-saffron-100">
            <span className="text-sm font-semibold text-saffron-900">Quit this lesson?</span>
            <div className="flex gap-2">
              <button onClick={() => setConfirmExit(false)} className="px-4 py-1.5 bg-saffron-100 text-saffron-700 rounded-lg text-sm font-semibold hover:bg-saffron-200 transition-colors">
                Stay
              </button>
              <button onClick={onExit} className="px-4 py-1.5 bg-error-500 text-white rounded-lg text-sm font-semibold hover:bg-error-600 transition-colors">
                Quit
              </button>
            </div>
          </div>
        ) : (
          <>
            <button onClick={() => setConfirmExit(true)} className="shrink-0 group">
              <X className="w-6 h-6 text-saffron-400 group-hover:text-saffron-600 transition-colors" />
            </button>
            <div className="flex-1 h-2.5 bg-saffron-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-saffron-400 via-saffron-500 to-saffron-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Heart className="w-5 h-5 text-maroon-500 fill-maroon-400" />
              <span className="font-bold text-maroon-600 text-sm">{Math.max(0, 5 - wrongCount)}</span>
            </div>
          </>
        )}
      </div>

      {/* Exercise content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4">
        <ExerciseContent
          key={currentExercise.id}
          exercise={currentExercise}
          onAnswer={handleAnswer}
          result={result}
        />
      </div>

      {/* Bottom bar: info slides get a "Continue" button, assessments get feedback bar */}
      {isInfoSlide && (
        <div className="px-4 py-4 max-w-2xl mx-auto w-full">
          <button
            onClick={handleNext}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold shadow-lg shadow-saffron-500/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {currentIndex + 1 >= exercises.length ? 'Finish Lesson' : 'Continue'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {!isInfoSlide && result && (
        <div className={`border-t-2 px-4 py-5 animate-slide-up ${
          result === 'correct'
            ? 'bg-gradient-to-r from-success-50 to-success-50 border-success-500'
            : 'bg-gradient-to-r from-error-50 to-error-50 border-error-500'
        }`}>
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${
                result === 'correct'
                  ? 'bg-gradient-to-br from-success-500 to-success-600'
                  : 'bg-gradient-to-br from-error-500 to-error-600'
              }`}>
                {result === 'correct' ? (
                  <Check className="w-7 h-7 text-white" strokeWidth={3} />
                ) : (
                  <X className="w-7 h-7 text-white" strokeWidth={3} />
                )}
              </div>
              <div>
                <p className={`font-extrabold text-lg ${
                  result === 'correct' ? 'text-success-700' : 'text-error-700'
                }`}>
                  {result === 'correct' ? 'Excellent!' : 'Not quite'}
                </p>
                {result === 'incorrect' && currentExercise.question_data.correct_answer && (
                  <p className="text-sm text-error-600 font-medium">
                    Correct answer: <span className="font-devanagari text-base">{currentExercise.question_data.correct_answer}</span>
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleNext}
              className={`px-7 py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 ${
                result === 'correct'
                  ? 'bg-gradient-to-r from-success-500 to-success-600 shadow-success-500/30'
                  : 'bg-gradient-to-r from-error-500 to-error-600 shadow-error-500/30'
              }`}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseContent({
  exercise,
  onAnswer,
  result,
}: {
  exercise: Exercise;
  onAnswer: (isCorrect: boolean) => void;
  result: ExerciseResult;
}) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongMatch, setWrongMatch] = useState<string | null>(null);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<string[]>([]);
  const [availableItems, setAvailableItems] = useState<string[]>([]);
  const answeredRef = useRef(false);

  useEffect(() => {
    setSelectedAnswer(null);
    setMatchedPairs(new Set());
    setWrongMatch(null);
    setSelectedLeft(null);
    setOrderItems([]);
    setAvailableItems([]);
    answeredRef.current = false;
    if (exercise.exercise_type === 'order_sequence') {
      const shuffled = [...(exercise.question_data.correct_order ?? [])].sort(() => Math.random() - 0.5);
      setAvailableItems(shuffled);
    }
  }, [exercise.id]);

  const handleTTS = async () => {
    if (!exercise.tts_text) return;
    try {
      const { data: settings } = await supabase
        .from('user_settings')
        .select('elevenlabs_api_key, tts_voice_id, tts_model_id')
        .maybeSingle();

      if (!settings?.elevenlabs_api_key) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            text: exercise.tts_text,
            apiKey: settings.elevenlabs_api_key,
            voiceId: settings.tts_voice_id || '21m00Tcm4TlvDq8ikWAM',
            modelId: settings.tts_model_id || 'eleven_multilingual_v2',
          }),
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();
      }
    } catch {
      // TTS is optional
    }
  };

  // Match pairs: check completion
  useEffect(() => {
    if (exercise.exercise_type === 'match_pairs' && !answeredRef.current && result === null) {
      const pairs = exercise.question_data.pairs ?? [];
      if (matchedPairs.size === pairs.length && pairs.length > 0) {
        answeredRef.current = true;
        onAnswer(true);
      }
    }
  }, [matchedPairs, exercise, onAnswer, result]);

  // Order sequence: check completion
  useEffect(() => {
    if (exercise.exercise_type === 'order_sequence' && !answeredRef.current && result === null) {
      const correctOrder = exercise.question_data.correct_order ?? [];
      if (orderItems.length === correctOrder.length && correctOrder.length > 0) {
        const isCorrect = orderItems.every((item, idx) => item === correctOrder[idx]);
        answeredRef.current = true;
        onAnswer(isCorrect);
      }
    }
  }, [orderItems, exercise, onAnswer, result]);

  if (exercise.exercise_type === 'info') {
    return <InfoSlide exercise={exercise} onTTS={handleTTS} />;
  }

  if (exercise.exercise_type === 'multiple_choice') {
    const options = exercise.question_data.options ?? [];
    const correct = exercise.question_data.correct_answer ?? '';

    return (
      <div className="flex-1 flex flex-col py-4 animate-fade-in">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-saffron-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-saffron-500" />
              </div>
              <p className="text-xs font-bold text-saffron-400 uppercase tracking-wider">
                Choose the answer
              </p>
            </div>
            <h2 className="text-xl font-bold text-saffron-900 leading-snug">{exercise.prompt}</h2>
            {exercise.prompt_devanagari && (
              <p className="font-devanagari text-5xl font-bold text-saffron-700 mt-4">
                {exercise.prompt_devanagari}
              </p>
            )}
          </div>
          {exercise.tts_text && (
            <button
              onClick={handleTTS}
              className="shrink-0 w-11 h-11 rounded-2xl bg-saffron-100 flex items-center justify-center hover:bg-saffron-200 transition-all hover:scale-105 active:scale-95"
            >
              <Volume2 className="w-5 h-5 text-saffron-600" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {options.map((option, idx) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === correct;
            let className = 'bg-white border-2 border-saffron-100 text-saffron-900 hover:border-saffron-300 hover:bg-saffron-50/50';

            if (result === null && isSelected) {
              className = 'bg-saffron-50 border-2 border-saffron-400 text-saffron-900 scale-[1.02]';
            } else if (result !== null && isCorrect) {
              className = 'bg-success-50 border-2 border-success-500 text-success-700';
            } else if (result !== null && isSelected && !isCorrect) {
              className = 'bg-error-50 border-2 border-error-500 text-error-700';
            }

            return (
              <button
                key={option}
                disabled={result !== null}
                onClick={() => {
                  setSelectedAnswer(option);
                  onAnswer(option === correct);
                }}
                style={{ animationDelay: `${idx * 50}ms` }}
                className={`rounded-2xl py-6 px-4 font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] animate-slide-up ${className} ${
                  /[\u0900-\u097F]/.test(option) ? 'font-devanagari text-2xl' : ''
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (exercise.exercise_type === 'match_pairs') {
    const pairs = exercise.question_data.pairs ?? [];
    const leftItems = pairs.map((p) => p.left);
    const rightItems = [...pairs.map((p) => p.right)].sort(() => Math.random() - 0.5);

    const handleMatch = (right: string) => {
      if (!selectedLeft || result !== null) return;
      const pair = pairs.find((p) => p.left === selectedLeft);
      if (pair && pair.right === right) {
        setMatchedPairs((prev) => new Set(prev).add(selectedLeft));
        setSelectedLeft(null);
      } else {
        setWrongMatch(right);
        setTimeout(() => setWrongMatch(null), 500);
        setSelectedLeft(null);
      }
    };

    return (
      <div className="flex-1 flex flex-col py-4 animate-fade-in">
        <div className="inline-flex items-center gap-1.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-saffron-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-saffron-500" />
          </div>
          <p className="text-xs font-bold text-saffron-400 uppercase tracking-wider">
            Tap the matching pairs
          </p>
        </div>
        <h2 className="text-xl font-bold text-saffron-900 mb-6">{exercise.prompt}</h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2.5">
            {leftItems.map((item) => {
              const isMatched = matchedPairs.has(item);
              const isSelected = selectedLeft === item;
              return (
                <button
                  key={item}
                  disabled={isMatched || result !== null}
                  onClick={() => setSelectedLeft(item)}
                  className={`w-full rounded-2xl py-4 px-3 font-bold text-lg transition-all border-2 ${
                    isMatched
                      ? 'bg-success-50 border-success-300 text-success-600 opacity-40'
                      : isSelected
                      ? 'bg-saffron-100 border-saffron-400 text-saffron-900 scale-[1.03] shadow-md shadow-saffron-200'
                      : 'bg-white border-saffron-100 text-saffron-900 hover:border-saffron-300 hover:bg-saffron-50/50'
                  } ${/[\u0900-\u097F]/.test(item) ? 'font-devanagari text-2xl' : ''}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
          <div className="space-y-2.5">
            {rightItems.map((item) => {
              const pair = pairs.find((p) => p.right === item);
              const isMatched = pair ? matchedPairs.has(pair.left) : false;
              const isWrong = wrongMatch === item;
              return (
                <button
                  key={item}
                  disabled={isMatched || result !== null}
                  onClick={() => handleMatch(item)}
                  className={`w-full rounded-2xl py-4 px-3 font-bold text-lg transition-all border-2 ${
                    isMatched
                      ? 'bg-success-50 border-success-300 text-success-600 opacity-40'
                      : isWrong
                      ? 'bg-error-50 border-error-500 text-error-700 animate-shake'
                      : 'bg-white border-saffron-100 text-saffron-900 hover:border-saffron-300 hover:bg-saffron-50/50'
                  } ${/[\u0900-\u097F]/.test(item) ? 'font-devanagari text-2xl' : ''}`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (exercise.exercise_type === 'order_sequence') {
    const correctOrder = exercise.question_data.correct_order ?? [];

    const handleAddToOrder = (item: string) => {
      if (result !== null) return;
      setAvailableItems((prev) => prev.filter((i) => i !== item));
      setOrderItems((prev) => [...prev, item]);
    };

    const handleRemoveFromOrder = (item: string) => {
      if (result !== null) return;
      setOrderItems((prev) => prev.filter((i) => i !== item));
      setAvailableItems((prev) => [...prev, item]);
    };

    const isOrderCorrect = orderItems.length === correctOrder.length &&
      orderItems.every((item, idx) => item === correctOrder[idx]);

    return (
      <div className="flex-1 flex flex-col py-4 animate-fade-in">
        <div className="inline-flex items-center gap-1.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-saffron-100 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-saffron-500" />
          </div>
          <p className="text-xs font-bold text-saffron-400 uppercase tracking-wider">
            Arrange in order
          </p>
        </div>
        <h2 className="text-xl font-bold text-saffron-900 mb-6">{exercise.prompt}</h2>

        <div className="mb-4 min-h-[70px] rounded-2xl border-2 border-dashed border-saffron-200 p-3 bg-saffron-50/30">
          {orderItems.length === 0 ? (
            <p className="text-saffron-300 text-sm text-center py-4">Tap items below to add them in order</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {orderItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRemoveFromOrder(item)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    result === null
                      ? 'bg-gradient-to-r from-saffron-500 to-saffron-600 text-white shadow-md shadow-saffron-300 hover:scale-105'
                      : isOrderCorrect
                      ? 'bg-gradient-to-r from-success-500 to-success-600 text-white'
                      : 'bg-gradient-to-r from-error-500 to-error-600 text-white'
                  } ${/[\u0900-\u097F]/.test(item) ? 'font-devanagari' : ''}`}
                >
                  {idx + 1}. {item}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {availableItems.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleAddToOrder(item)}
              disabled={result !== null}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm bg-white border-2 border-saffron-100 text-saffron-900 hover:border-saffron-300 hover:bg-saffron-50/50 transition-all hover:scale-105 active:scale-95 ${
                /[\u0900-\u097F]/.test(item) ? 'font-devanagari' : ''
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-4">
      <p className="text-saffron-600">Exercise type not supported yet.</p>
    </div>
  );
}

function InfoSlide({
  exercise,
  onTTS,
}: {
  exercise: Exercise;
  onTTS: () => void;
}) {
  const q = exercise.question_data;

  return (
    <div className="flex-1 flex flex-col py-4 animate-fade-in">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-saffron-400 to-saffron-600 flex items-center justify-center shadow-md shadow-saffron-300">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <p className="text-xs font-bold text-saffron-500 uppercase tracking-wider">Learn</p>
      </div>

      {/* Title */}
      {q.title && (
        <h2 className="text-2xl font-extrabold text-saffron-900 leading-tight mb-1">{q.title}</h2>
      )}
      {q.subtitle && (
        <p className="text-saffron-500 font-medium mb-5">{q.subtitle}</p>
      )}

      {/* Body text */}
      {q.body && (
        <p className="text-saffron-800 leading-relaxed mb-5 text-[15px]">{q.body}</p>
      )}

      {/* Devanagari examples */}
      {q.devanagari_examples && q.devanagari_examples.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-5">
          {q.devanagari_examples.map((ex, idx) => {
            const translit = q.transliteration_examples?.[idx] ?? '';
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-3 text-center border border-saffron-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <p className="font-devanagari text-3xl font-bold text-saffron-700 mb-1">{ex}</p>
                <p className="text-xs text-saffron-400 font-medium">{translit}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      {q.table_headers && q.table_rows && (
        <div className="overflow-hidden rounded-2xl border border-saffron-100 shadow-sm mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-saffron-500 to-saffron-600">
                {q.table_headers.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left font-bold text-white">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {q.table_rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-saffron-50/50'}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={`px-4 py-2.5 text-saffron-800 ${/[\u0900-\u097F]/.test(cell) ? 'font-devanagari font-semibold' : ''}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tip */}
      {q.tip && (
        <div className="flex items-start gap-3 bg-gradient-to-r from-gold-100 to-gold-50 rounded-2xl p-4 border border-gold-200 mb-4">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-gold-300 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-gold-700" />
          </div>
          <p className="text-sm text-gold-700 font-medium leading-relaxed">{q.tip}</p>
        </div>
      )}

      {/* TTS button */}
      {exercise.tts_text && (
        <button
          onClick={onTTS}
          className="inline-flex items-center gap-2 text-sm font-semibold text-saffron-600 hover:text-saffron-700 transition-colors"
        >
          <Volume2 className="w-4 h-4" />
          Listen to pronunciation
        </button>
      )}
    </div>
  );
}

function LessonCompleteScreen({
  correctCount,
  totalCount,
  accuracy,
  xpEarned,
  onContinue,
}: {
  correctCount: number;
  totalCount: number;
  accuracy: number;
  xpEarned: number;
  onContinue: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cream via-saffron-50 to-saffron-100 flex flex-col items-center justify-center px-4">
      {/* Decorative background circles */}
      <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-saffron-200/30 blur-2xl" />
      <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-gold-200/30 blur-2xl" />

      <div className="w-full max-w-md text-center animate-bounce-in relative z-10">
        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-gold-500 shadow-2xl shadow-gold-400/40 mb-6">
          <Trophy className="w-14 h-14 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-saffron-900 mb-2">Lesson Complete!</h1>
        <p className="text-saffron-500 font-medium mb-6">
          {accuracy === 100 ? 'Flawless! ' : accuracy >= 80 ? 'Great work! ' : 'Keep practicing! '}
          You're making real progress.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-saffron-100">
            <div className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center mx-auto mb-2">
              <Check className="w-5 h-5 text-success-600" strokeWidth={3} />
            </div>
            <p className="text-xs font-semibold text-saffron-400 uppercase mb-0.5">Accuracy</p>
            <p className="text-2xl font-extrabold text-saffron-700">{accuracy}%</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-saffron-100">
            <div className="w-10 h-10 rounded-xl bg-saffron-50 flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-saffron-500" />
            </div>
            <p className="text-xs font-semibold text-saffron-400 uppercase mb-0.5">Correct</p>
            <p className="text-2xl font-extrabold text-saffron-700">{correctCount}/{totalCount}</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-saffron-100">
            <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center mx-auto mb-2">
              <Zap className="w-5 h-5 text-gold-600" />
            </div>
            <p className="text-xs font-semibold text-saffron-400 uppercase mb-0.5">XP Earned</p>
            <p className="text-2xl font-extrabold text-gold-600">+{xpEarned}</p>
          </div>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-bold shadow-xl shadow-saffron-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
