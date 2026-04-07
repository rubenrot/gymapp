import { useState, useEffect, useMemo } from 'react';
import { Calendar, ChevronRight, ChevronDown } from 'lucide-react';
import { getSessions, getWorkoutById, getSetsBySession, getExerciseById } from '../db/database';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';


export default function History() {
    const [sessions, setSessions] = useState([]);
    const [expandedDates, setExpandedDates] = useState({});
    const [expandedSessions, setExpandedSessions] = useState({});

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
                        ? `${uniqueWeights[0]}kg × ${sorted.map(s => s.reps).join(' | ')}`
                        : sorted.map(s => `${s.weight}kg×${s.reps}`).join(' | ');
                    return { name: ex.name, summary, sets: sorted };
                });

                return {
                    ...session,
                    workoutName: workout?.name || 'Rutina eliminada',
                    exerciseSummaries
                };
            })
        );

        // Filter out sessions with no exercises recorded
        setSessions(enriched.filter(s => s.exerciseSummaries.length > 0));
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
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
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
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
                                {group.sessions.map((session) => {
                                    const isSessionExpanded = !!expandedSessions[session.id];
                                    return (
                                    <div
                                        key={session.id}
                                        style={{
                                            marginLeft: 'var(--spacing-sm)',
                                            background: 'var(--surface-2)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-lg)',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        {/* Session header – toggles expand/collapse */}
                                        <div
                                            onClick={() => setExpandedSessions(prev => ({ ...prev, [session.id]: !prev[session.id] }))}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '10px 12px',
                                                cursor: 'pointer',
                                                borderBottom: isSessionExpanded && session.exerciseSummaries?.length > 0 ? '1px solid var(--border)' : 'none'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                {isSessionExpanded
                                                    ? <ChevronDown size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                                    : <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                                                }
                                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                                                    {session.workoutName}
                                                </span>
                                            </div>
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
                                            </div>
                                        </div>

                                        {/* Exercise summaries – collapsible */}
                                        {isSessionExpanded && session.exerciseSummaries?.length > 0 && (
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
                                    );
                                })}
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
