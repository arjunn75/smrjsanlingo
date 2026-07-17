import { useState } from 'react';
import { AuthProvider, ProgressProvider, useAuth } from './lib/auth';
import { AuthScreen } from './screens/AuthScreen';
import { LearningPathScreen } from './screens/LearningPathScreen';
import { LessonPlayerScreen } from './screens/LessonPlayerScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Home, User } from 'lucide-react';

type Screen = 'path' | 'lesson' | 'profile' | 'settings';

function AppContent() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>('path');
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-saffron-200 border-t-saffron-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const handleStartLesson = (lessonId: string) => {
    setActiveLessonId(lessonId);
    setScreen('lesson');
  };

  const handleLessonComplete = () => {
    setActiveLessonId(null);
    setScreen('path');
  };

  return (
    <div className="min-h-screen bg-cream">
      {screen === 'path' && <LearningPathScreen onStartLesson={handleStartLesson} />}
      {screen === 'lesson' && activeLessonId && (
        <LessonPlayerScreen
          lessonId={activeLessonId}
          onExit={() => {
            setActiveLessonId(null);
            setScreen('path');
          }}
          onComplete={handleLessonComplete}
        />
      )}
      {screen === 'profile' && (
        <ProfileScreen onNavigate={(s) => setScreen(s)} />
      )}
      {screen === 'settings' && <SettingsScreen onBack={() => setScreen('profile')} />}

      {/* Bottom nav (hidden during lesson) */}
      {screen !== 'lesson' && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-saffron-100/50">
          <div className="max-w-2xl mx-auto flex items-center justify-around py-2 px-4">
            <button
              onClick={() => setScreen('path')}
              className={`flex flex-col items-center gap-0.5 px-8 py-1.5 rounded-xl transition-all ${
                screen === 'path'
                  ? 'text-saffron-600'
                  : 'text-saffron-300 hover:text-saffron-500'
              }`}
            >
              <Home className="w-6 h-6" strokeWidth={screen === 'path' ? 2.5 : 2} />
              <span className="text-xs font-semibold">Learn</span>
            </button>
            <button
              onClick={() => setScreen('profile')}
              className={`flex flex-col items-center gap-0.5 px-8 py-1.5 rounded-xl transition-all ${
                screen === 'profile' || screen === 'settings'
                  ? 'text-saffron-600'
                  : 'text-saffron-300 hover:text-saffron-500'
              }`}
            >
              <User className="w-6 h-6" strokeWidth={screen === 'profile' || screen === 'settings' ? 2.5 : 2} />
              <span className="text-xs font-semibold">Profile</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProgressProvider>
        <AppContent />
      </ProgressProvider>
    </AuthProvider>
  );
}

export default App;
