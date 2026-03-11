import { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, ChevronRight, ChevronDown } from 'lucide-react';
import { getSessions, getWorkoutById, getSetsBySession, getExerciseById } from '../db/database';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';


export default function History() {
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessionDetails, setSessionDetails] = useState(null);
    const [expandedDates, setExpandedDates] = useState({});

    useEffect(() => {
        loadSessions();
    }, []);

    async function loadSessions() {
        const sessionList = await getSessions();

        // Enrich with workout names
        const enriched = await Promise.all(
            sessionList.map(async session => {
                const workout = await getWorkoutById(session.workoutId);
                return { ...session, workoutName: workout?.name || 'Rutina eliminada' };
            })
        );

        setSessions(enriched);
    }

    // Group sessions by date
    const groupedSessions = useMemo(() => {
        const groups = {};
        for (const session of sessions) {
            const dateKey = startOfDay(new Date(session.date)).toISOString();
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: new Date(session.date),
                    label: format(new Date(session.date), "EEEE d 'de' MMMM yyyy", { locale: es }),
                    sessions: []
                };
            }
            groups[dateKey].sessions.push(session);
        }
        // Sort by date descending
        return Object.values(groups).sort((a, b) => b.date - a.date);
    }, [sessions]);

    async function loadSessionDetails(session) {
        const sets = await getSetsBySession(session.id);

        // Group sets by exercise
        const exerciseMap = {};
        for (const set of sets) {
            if (!exerciseMap[set.exerciseId]) {
                const exercise = await getExerciseById(set.exerciseId);
                exerciseMap[set.exerciseId] = {
                    exercise: exercise || { name: 'Ejercicio eliminado' },
                    sets: []
                };
            }
            exerciseMap[set.exerciseId].sets.push(set);
        }

        setSessionDetails(Object.values(exerciseMap));
        setSelectedSession(session);
    }

    if (selectedSession && sessionDetails) {
        return (
            <div className="container animate-fadeIn" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
                <button
                    onClick={() => {
                        setSelectedSession(null);
                        setSessionDetails(null);
                    }}
                    className="btn btn-secondary"
                    style={{ marginBottom: 'var(--spacing-lg)' }}
                >
                    ← Volver
                </button>

                <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h2 style={{ marginBottom: 'var(--spacing-sm)' }}>{selectedSession.workoutName}</h2>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        <span>
                            <Calendar size={16} style={{ display: 'inline', marginRight: '4px' }} />
                            {format(new Date(selectedSession.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                        </span>
                        {selectedSession.duration > 0 && (
                            <span>
                                <Clock size={16} style={{ display: 'inline', marginRight: '4px' }} />
                                {selectedSession.duration} min
                            </span>
                        )}
                    </div>
                </div>

                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Ejercicios realizados</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {sessionDetails.map(({ exercise, sets }) => (
                        <div key={exercise.id} className="card">
                            <h4 style={{ marginBottom: 'var(--spacing-md)' }}>{exercise.name}</h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {sets.map(set => (
                                    <div
                                        key={set.id}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            padding: 'var(--spacing-sm)',
                                            background: 'var(--bg-input)',
                                            borderRadius: 'var(--radius-md)'
                                        }}
                                    >
                                        <span>Serie {set.setNumber}</span>
                                        <span style={{ fontWeight: 600 }}>
                                            {set.weight} kg × {set.reps} reps
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Historial</h2>

            {sessions.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Aún no has completado ninguna sesión.
                        <br />
                        ¡Empieza tu primer entrenamiento!
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                    {groupedSessions.map((group) => {
                        const dateKey = group.date.toISOString();
                        const isExpanded = !!expandedDates[dateKey];

                        return (
                        <div key={dateKey}>
                            {/* Date Header - clickable */}
                            <button
                                onClick={() => setExpandedDates(prev => ({ ...prev, [dateKey]: !prev[dateKey] }))}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    marginBottom: isExpanded ? 'var(--spacing-md)' : 0,
                                    paddingBottom: 'var(--spacing-sm)',
                                    padding: 'var(--spacing-md)',
                                    borderBottom: '1px solid var(--border)',
                                    background: 'var(--surface-1)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 'var(--radius-lg)',
                                    cursor: 'pointer',
                                    color: 'var(--text-primary)',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {isExpanded
                                    ? <ChevronDown size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                    : <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                }
                                <Calendar size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                <span style={{
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    textTransform: 'capitalize',
                                    flex: 1,
                                    textAlign: 'left'
                                }}>
                                    {group.label}
                                </span>
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    background: 'var(--surface-2)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-full)',
                                    flexShrink: 0
                                }}>
                                    {group.sessions.length} {group.sessions.length === 1 ? 'sesión' : 'sesiones'}
                                </span>
                            </button>

                            {/* Sessions for this date - collapsible */}
                            {isExpanded && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: 'var(--spacing-sm)' }}>
                                {group.sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => loadSessionDetails(session)}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '8px 12px',
                                            marginLeft: 'var(--spacing-md)',
                                            background: 'var(--surface-2)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s ease'
                                        }}
                                    >
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                            {session.workoutName}
                                        </span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexShrink: 0 }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {format(new Date(session.date), "HH:mm")}
                                            </span>
                                            {session.duration > 0 && (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--text-muted)',
                                                    background: 'var(--bg-input)',
                                                    padding: '1px 6px',
                                                    borderRadius: 'var(--radius-full)'
                                                }}>
                                                    {session.duration}min
                                                </span>
                                            )}
                                            <ChevronRight size={14} color="var(--text-muted)" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            )}
                        </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
