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

        // Enrich with workout names AND exercise summaries
        const enriched = await Promise.all(
            sessionList.map(async session => {
                const workout = await getWorkoutById(session.workoutId);
                const sets = await getSetsBySession(session.id);

                // Group sets by exercise
                const exerciseMap = {};
                for (const set of sets) {
                    if (!exerciseMap[set.exerciseId]) {
                        const exercise = await getExerciseById(set.exerciseId);
                        exerciseMap[set.exerciseId] = {
                            name: exercise?.name || 'Ejercicio eliminado',
                            sets: []
                        };
                    }
                    exerciseMap[set.exerciseId].sets.push(set);
                }

                // Build compact summaries per exercise
                const exerciseSummaries = Object.values(exerciseMap).map(ex => {
                    const sorted = [...ex.sets].sort((a, b) => a.setNumber - b.setNumber);
                    const uniqueWeights = [...new Set(sorted.map(s => s.weight))];
                    const summary = uniqueWeights.length === 1
                        ? `${uniqueWeights[0]}kg × ${sorted.map(s => s.reps).join('/')}`
                        : sorted.map(s => `${s.weight}kg×${s.reps}`).join(' / ');
                    return { name: ex.name, summary, sets: sorted };
                });

                return {
                    ...session,
                    workoutName: workout?.name || 'Rutina eliminada',
                    exerciseSummaries
                };
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
                    {sessionDetails.map(({ exercise, sets }) => {
                        const sortedSets = [...sets].sort((a, b) => a.setNumber - b.setNumber);
                        const avgWeight = sets.length > 0
                            ? (sets.reduce((sum, s) => sum + (s.weight || 0), 0) / sets.length)
                            : 0;
                        const avgFormatted = Number.isInteger(avgWeight) ? avgWeight : avgWeight.toFixed(1);

                        // Compact summary: if all weights are the same, show "60kg x 8 / 8 / 7"
                        const uniqueWeights = [...new Set(sortedSets.map(s => s.weight))];
                        const compactSummary = uniqueWeights.length === 1
                            ? `${uniqueWeights[0]}kg × ${sortedSets.map(s => s.reps).join(' / ')}`
                            : null;

                        return (
                            <div key={exercise.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Exercise header */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: 'var(--spacing-md) var(--spacing-lg)',
                                    borderBottom: '1px solid var(--border)',
                                    background: 'var(--surface-1)'
                                }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{exercise.name}</span>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-muted)',
                                        background: 'var(--surface-2)',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--radius-full)',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        Ø {avgFormatted} kg
                                    </span>
                                </div>

                                {/* Compact summary */}
                                {compactSummary && (
                                    <div style={{
                                        padding: 'var(--spacing-sm) var(--spacing-lg)',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        color: 'var(--accent)',
                                        borderBottom: '1px solid var(--border)'
                                    }}>
                                        {compactSummary}
                                    </div>
                                )}

                                {/* Individual sets */}
                                <div style={{ padding: 'var(--spacing-sm) var(--spacing-lg)' }}>
                                    {sortedSets.map((set, si) => (
                                        <div key={si} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-md)',
                                            padding: '4px 0',
                                            borderBottom: si < sortedSets.length - 1 ? '1px solid var(--border)' : 'none',
                                            fontSize: '0.8rem'
                                        }}>
                                            <span style={{
                                                color: 'var(--text-muted)',
                                                fontWeight: 600,
                                                minWidth: '20px'
                                            }}>
                                                S{set.setNumber}
                                            </span>
                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                {set.weight} kg
                                            </span>
                                            <span style={{ color: 'var(--text-secondary)' }}>
                                                × {set.reps} reps
                                            </span>
                                            {set.rpe && (
                                                <span style={{
                                                    marginLeft: 'auto',
                                                    fontSize: '0.7rem',
                                                    color: 'var(--text-muted)',
                                                    background: 'var(--surface-2)',
                                                    padding: '1px 6px',
                                                    borderRadius: 'var(--radius-full)'
                                                }}>
                                                    RPE {set.rpe}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
                                {group.sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        onClick={() => loadSessionDetails(session)}
                                        style={{
                                            marginLeft: 'var(--spacing-sm)',
                                            background: 'var(--surface-2)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-lg)',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s ease',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Session header */}
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '10px 12px',
                                            borderBottom: session.exerciseSummaries?.length > 0 ? '1px solid var(--border)' : 'none'
                                        }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
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

                                        {/* Exercise summaries */}
                                        {session.exerciseSummaries?.length > 0 && (
                                            <div style={{ padding: '6px 12px 8px' }}>
                                                {session.exerciseSummaries.map((ex, i) => (
                                                    <div key={i} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '3px 0',
                                                        borderBottom: i < session.exerciseSummaries.length - 1 ? '1px solid var(--border)' : 'none',
                                                        gap: 'var(--spacing-sm)'
                                                    }}>
                                                        <span style={{
                                                            fontSize: '0.75rem',
                                                            color: 'var(--text-secondary)',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            flex: 1,
                                                            minWidth: 0
                                                        }}>
                                                            {ex.name}
                                                        </span>
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            color: 'var(--accent)',
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                            flexShrink: 0
                                                        }}>
                                                            {ex.summary}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
