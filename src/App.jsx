import { useState, useEffect } from 'react';
import { KeepAwake } from '@capacitor-community/keep-awake';
import Layout from './components/Layout';
import WorkoutList from './components/WorkoutList';
import WorkoutDetail from './components/WorkoutDetail';
import SessionTracker from './components/SessionTracker';
import History from './components/History';
import ProgressCharts from './components/ProgressCharts';
import Profile from './components/Profile';
import ExerciseLibrary from './components/ExerciseLibrary';
import TimerModule from './components/TimerModule';
import {
  initializeDatabase,
  getActiveWorkoutSession,
  markActiveSessionDiscarded,
  getWorkoutById
} from './db/database';
import { applyTheme } from './utils/theme';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('workouts');
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Crash-recovery state
  const [recoverySession, setRecoverySession] = useState(null); // raw activeWorkoutSessions row
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);

  useEffect(() => {
    async function init() {
      applyTheme();
      await initializeDatabase();
      try {
        await KeepAwake.keepAwake();
      } catch (err) {
        console.warn('KeepAwake error:', err);
      }

      // ── Crash recovery: look for an unfinished active session ──────────
      try {
        const active = await getActiveWorkoutSession();
        if (active) {
          setRecoverySession(active);
          setShowRecoveryModal(true);
        }
      } catch (err) {
        console.warn('Recovery check error:', err);
      }

      setIsInitialized(true);
    }
    init();
  }, []);

  // Global exit confirmation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '¿Seguro que quieres salir de Valhalla?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // ── Recovery handlers ──────────────────────────────────────────────────
  async function handleRecoveryContinue() {
    setShowRecoveryModal(false);
    if (!recoverySession) return;
    // Fetch the full workout object from IndexedDB
    const workout = await getWorkoutById(recoverySession.workoutId);
    if (workout) {
      setActiveSession({ ...workout, savedSession: recoverySession });
    }
  }

  async function handleRecoveryDiscard() {
    setShowRecoveryModal(false);
    if (recoverySession) {
      await markActiveSessionDiscarded(recoverySession.id);
    }
    setRecoverySession(null);
  }

  // ── Normal workout navigation ──────────────────────────────────────────
  function handleSelectWorkout(workout, savedSession = null) {
    if (savedSession) {
      setActiveSession({ ...workout, savedSession });
    } else {
      setSelectedWorkout(workout);
    }
  }

  function handleBackToList() {
    setSelectedWorkout(null);
  }

  function handleStartSession(workout) {
    setActiveSession(workout);
  }

  function handleEndSession() {
    setActiveSession(null);
    setSelectedWorkout(null);
    setCurrentView('workouts');
  }

  function handleNavigate(view) {
    setCurrentView(view);
    setSelectedWorkout(null);
  }

  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        gap: 'var(--spacing-lg)'
      }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando Valhalla...</p>
      </div>
    );
  }

  // Active session view (full screen)
  if (activeSession) {
    return <SessionTracker workout={activeSession} onClose={handleEndSession} />;
  }

  // Main app with navigation
  return (
    <>
      <Layout currentView={currentView} onNavigate={handleNavigate}>
        {currentView === 'workouts' && !selectedWorkout && (
          <WorkoutList onSelectWorkout={handleSelectWorkout} />
        )}

        {currentView === 'workouts' && selectedWorkout && (
          <WorkoutDetail
            workout={selectedWorkout}
            onBack={handleBackToList}
            onStartSession={handleStartSession}
          />
        )}

        {currentView === 'history' && <History />}

        {currentView === 'progress' && <ProgressCharts />}

        {currentView === 'timer' && <TimerModule onBack={() => handleNavigate('workouts')} />}

        {currentView === 'profile' && <Profile onNavigate={handleNavigate} />}

        {currentView === 'exercises' && <ExerciseLibrary onBack={() => handleNavigate('profile')} />}
      </Layout>

      {/* ── Crash-recovery modal ─────────────────────────────────────────── */}
      {showRecoveryModal && recoverySession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--spacing-lg)'
          }}
        >
          <div
            className="animate-slideUp"
            style={{
              background: 'var(--surface-1, var(--bg-card))',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--spacing-xl)',
              maxWidth: '380px',
              width: '100%',
              textAlign: 'center'
            }}
          >
            <div style={{
              fontSize: '2.5rem',
              marginBottom: 'var(--spacing-md)'
            }}>⚡</div>

            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>
              Sesión en curso
            </h3>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              marginBottom: 'var(--spacing-xs)'
            }}>
              <strong>{recoverySession.workoutName}</strong>
            </p>

            {recoverySession.updatedAt && (
              <p style={{
                color: 'var(--text-muted)',
                fontSize: '0.78rem',
                marginBottom: 'var(--spacing-xl)'
              }}>
                Guardado el {new Date(recoverySession.updatedAt).toLocaleString('es-ES', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            )}

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              marginBottom: 'var(--spacing-xl)'
            }}>
              Tienes una sesión en curso. ¿Quieres continuarla?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <button
                onClick={handleRecoveryContinue}
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
              >
                ▶ Continuar sesión
              </button>
              <button
                onClick={handleRecoveryDiscard}
                className="btn btn-secondary"
                style={{ width: '100%', opacity: 0.8 }}
              >
                Descartar y empezar de nuevo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
