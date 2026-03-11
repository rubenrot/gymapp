import { useState, useEffect } from 'react';
import { ChevronRight, Calendar, Play, Pause, X } from 'lucide-react';
import { getWorkouts, getSessionsByWorkout, getExercisesByWorkout } from '../db/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getSavedSession, clearSession } from '../utils/sessionStorage';

export default function WorkoutList({ onSelectWorkout }) {
    const [workouts, setWorkouts] = useState([]);
    const [lastSessions, setLastSessions] = useState({});
    const [blockCounts, setBlockCounts] = useState({});
    const [pausedSession, setPausedSession] = useState(null);

    async function loadWorkouts() {
        const workoutList = await getWorkouts();
        setWorkouts(workoutList);

        // Load last session for each workout
        const sessions = {};
        const blocks = {};
        for (const workout of workoutList) {
            const workoutSessions = await getSessionsByWorkout(workout.id, 1);
            if (workoutSessions.length > 0) {
                sessions[workout.id] = workoutSessions[0];
            }
            // Count unique blocks per workout
            const exercises = await getExercisesByWorkout(workout.id);
            const uniqueBlocks = new Set(exercises.map(e => e.block || '__no_block__'));
            blocks[workout.id] = uniqueBlocks.size;
        }
        setLastSessions(sessions);
        setBlockCounts(blocks);
    }

    function loadPausedSession() {
        const saved = getSavedSession();
        setPausedSession(saved);
    }

    useEffect(() => {
        loadWorkouts();
        loadPausedSession();
    }, []);

    function handleContinueSession() {
        if (pausedSession) {
            // Find the full workout object
            const workout = workouts.find(w => w.id === pausedSession.workoutId);
            if (workout) {
                // Pass full workout object with saved session data
                onSelectWorkout(workout, pausedSession);
            }
        }
    }

    function handleDiscardSession() {
        clearSession();
        setPausedSession(null);
    }

    const workoutColors = [
        'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-2) 100%)',
        'linear-gradient(180deg, var(--surface-1) 0%, var(--bg-secondary) 100%)',
        'linear-gradient(180deg, var(--surface-2) 0%, var(--surface-1) 100%)',
        'linear-gradient(180deg, var(--bg-secondary) 0%, var(--surface-2) 100%)'
    ];

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-xl)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Tus Rutinas</h2>

            {/* Paused Session Indicator */}
            {pausedSession && (
                <div className="card" style={{
                    marginBottom: 'var(--spacing-xl)',
                    background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface-1) 100%)',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-main)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Pause size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: 0, marginBottom: 'var(--spacing-xs)' }}>Sesión en progreso</h3>
                            <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.9 }}>
                                {pausedSession.workoutName}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.8, marginTop: 'var(--spacing-xs)' }}>
                                Ejercicio {pausedSession.currentExerciseIndex + 1}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        <button
                            onClick={handleContinueSession}
                            className="btn btn-lg"
                            style={{
                                flex: 1,
                                background: 'var(--accent)',
                                color: 'var(--text-on-accent)',
                                fontWeight: 600
                            }}
                        >
                            <Play size={20} />
                            Continuar Sesión
                        </button>
                        <button
                            onClick={handleDiscardSession}
                            className="btn btn-lg"
                            style={{
                                background: 'var(--bg-input)',
                                color: 'var(--text-main)'
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-2">
                {workouts.map((workout, index) => {
                    const lastSession = lastSessions[workout.id];

                    return (
                        <div
                            key={workout.id}
                            className="card card-interactive animate-fadeIn"
                            onClick={() => onSelectWorkout(workout)}
                            style={{
                                background: workoutColors[index % workoutColors.length],
                                border: '1px solid var(--border)',
                                borderLeft: '3px solid var(--accent, #0ce6c7)',
                                color: 'var(--text-main)',
                                animationDelay: `${index * 100}ms`,
                                padding: 'var(--spacing-md)'
                            }}
                        >
                            <div style={{ marginBottom: 'var(--spacing-xs)' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>
                                    {workout.name}
                                </h3>
                                <p style={{ opacity: 0.9, fontSize: '0.8rem', marginBottom: 0 }}>
                                    {blockCounts[workout.id] === 1
                                        ? 'Bloque Único'
                                        : `${blockCounts[workout.id] || ''} Bloques`}
                                </p>
                                {workout.duration && (
                                    <p style={{ opacity: 0.7, fontSize: '0.7rem', marginBottom: 0, marginTop: '2px' }}>
                                        ⏱ {workout.duration}
                                    </p>
                                )}
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                {lastSession ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)',
                                        fontSize: '0.7rem',
                                        opacity: 0.8
                                    }}>
                                        <Calendar size={12} />
                                        <span>
                                            Última: {format(new Date(lastSession.date), "d 'de' MMMM", { locale: es })}
                                        </span>
                                    </div>
                                ) : <div />}
                                <ChevronRight size={20} style={{ opacity: 0.6 }} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {workouts.length === 0 && (
                <div style={{
                    textAlign: 'center',
                    padding: 'var(--spacing-2xl)',
                    color: 'var(--text-muted)'
                }}>
                    <p>Cargando rutinas...</p>
                </div>
            )}
        </div>
    );
}
