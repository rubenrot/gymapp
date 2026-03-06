import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Clock, Repeat, TrendingUp, Plus, Pencil, Trash2, X, Dumbbell, History } from 'lucide-react';
import { getExercisesByWorkout, getSetsByExercise, addExercise, updateExercise, deleteExercise } from '../db/database';
import ExerciseModal from './ExerciseModal';
import AppModal from './AppModal';
import { getExerciseGifUrl } from '../data/exerciseImages';

export default function WorkoutDetail({ workout, onBack, onStartSession }) {
    const [exercises, setExercises] = useState([]);
    const [lastWeights, setLastWeights] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [detailExercise, setDetailExercise] = useState(null);
    const [detailHistory, setDetailHistory] = useState([]);
    const [gifError, setGifError] = useState(false);

    useEffect(() => {
        if (!detailExercise) return;
        setGifError(false);
        const handleKey = (e) => { if (e.key === 'Escape') setDetailExercise(null); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [detailExercise]);

    useEffect(() => {
        loadExercises();
    }, [workout]);

    async function loadExercises() {
        const exerciseList = await getExercisesByWorkout(workout.id);
        setExercises(exerciseList);

        // Load last weight for each exercise
        const weights = {};
        for (const exercise of exerciseList) {
            const sets = await getSetsByExercise(exercise.id, 1);
            if (sets.length > 0) {
                weights[exercise.id] = sets[0].weight;
            }
        }
        setLastWeights(weights);
    }

    const handleAddClick = () => {
        setEditingExercise(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (exercise) => {
        setEditingExercise(exercise);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (exercise) => {
        setDeleteTarget(exercise);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        await deleteExercise(deleteTarget.id);
        setDeleteTarget(null);
        loadExercises();
    };

    const handleExerciseDetail = async (exercise) => {
        setDetailExercise(exercise);
        const sets = await getSetsByExercise(exercise.id, 20);
        setDetailHistory(sets);
    };

    const handleSaveExercise = async (data) => {
        try {
            if (editingExercise) {
                await updateExercise(editingExercise.id, data);
            } else {
                await addExercise({
                    ...data,
                    workoutId: workout.id
                });
            }
            setIsModalOpen(false);
            loadExercises();
        } catch (error) {
            console.error('Error saving exercise:', error);
            setErrorMsg('Error al guardar el ejercicio');
        }
    };

    return (
        <div className="animate-fadeIn" style={{ paddingBottom: '80px' }}>
            {/* Header */}
            <div style={{
                background: 'var(--gradient-primary)',
                padding: 'var(--spacing-xl) var(--spacing-md)',
                marginBottom: 'var(--spacing-xl)'
            }}>
                <div className="container">
                    <button
                        onClick={onBack}
                        className="btn-icon"
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            marginBottom: 'var(--spacing-md)'
                        }}
                    >
                        <ArrowLeft size={24} />
                    </button>

                    <h2 style={{ color: 'white', marginBottom: 'var(--spacing-xs)' }}>
                        {workout.name}
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: 0 }}>
                        {workout.day}
                        {workout.duration && (
                            <span style={{ marginLeft: '12px', opacity: 0.8 }}>⏱ {workout.duration}</span>
                        )}
                    </p>
                </div>
            </div>

            <div className="container">
                {/* Start Session Button */}
                <button
                    onClick={() => onStartSession(workout)}
                    className="btn btn-accent btn-lg"
                    style={{
                        width: '100%',
                        marginBottom: 'var(--spacing-xl)',
                        fontSize: '1.125rem',
                        boxShadow: 'var(--shadow-md)'
                    }}
                >
                    <Play size={24} />
                    Iniciar Sesión
                </button>

                {/* Exercise List */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-lg)' }}>
                    <h3 style={{ margin: 0 }}>Ejercicios</h3>
                    <div style={{
                        background: 'var(--bg-card)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border)'
                    }}>
                        {exercises.length} ejercicios
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {exercises.map((exercise, index) => {
                        const showBlockHeader = exercise.block &&
                            (index === 0 || exercises[index - 1].block !== exercise.block);

                        return (
                            <div key={exercise.id}>
                                {showBlockHeader && (
                                    <div style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        marginBottom: 'var(--spacing-sm)',
                                        marginTop: index > 0 ? 'var(--spacing-md)' : 0,
                                        background: 'var(--surface-2, rgba(255,255,255,0.05))',
                                        borderRadius: 'var(--radius-md)',
                                        borderLeft: '3px solid var(--accent, #22D3A6)',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: 'var(--accent, var(--text-primary))',
                                        letterSpacing: '0.02em'
                                    }}>
                                        🔹 {exercise.block}
                                    </div>
                                )}
                                <div
                                    className="card animate-slideInRight"
                                    style={{ animationDelay: `${index * 50}ms`, position: 'relative', paddingRight: '50px' }}
                                >
                            {/* Edit Button – top right */}
                            <button
                                onClick={() => handleEditClick(exercise)}
                                className="btn-icon"
                                style={{
                                    position: 'absolute',
                                    top: 'var(--spacing-sm)',
                                    right: 'var(--spacing-sm)',
                                    width: '28px',
                                    height: '28px',
                                    background: 'transparent',
                                    color: 'var(--text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    border: 'none',
                                    opacity: 0.6,
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                <Pencil size={14} />
                            </button>

                            {/* Delete Button – bottom right */}
                            <button
                                onClick={() => handleDeleteClick(exercise)}
                                className="btn-icon"
                                style={{
                                    position: 'absolute',
                                    bottom: 'var(--spacing-sm)',
                                    right: 'var(--spacing-sm)',
                                    width: '28px',
                                    height: '28px',
                                    background: 'transparent',
                                    color: 'var(--danger, #EF4444)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0,
                                    border: 'none',
                                    opacity: 0.5,
                                    transition: 'opacity 0.2s'
                                }}
                            >
                                <Trash2 size={14} />
                            </button>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: 'var(--spacing-md)'
                            }}>
                                <div
                                    onClick={() => handleExerciseDetail(exercise)}
                                    style={{ flex: 1, paddingRight: '40px', cursor: 'pointer' }}
                                >
                                    <h4 style={{
                                        fontSize: '1.125rem',
                                        marginBottom: 'var(--spacing-xs)',
                                        color: 'var(--text-primary)'
                                    }}>
                                        {exercise.name}
                                    </h4>

                                    {exercise.notes && (
                                        <p style={{
                                            fontSize: '0.875rem',
                                            color: 'var(--text-muted)',
                                            fontStyle: 'italic',
                                            marginBottom: 'var(--spacing-sm)'
                                        }}>
                                            {exercise.notes}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {lastWeights[exercise.id] && (
                                <div style={{
                                    marginBottom: 'var(--spacing-md)'
                                }}>
                                    <span style={{
                                        background: 'var(--gradient-primary)',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700,
                                        color: 'white'
                                    }}>
                                        Último: {lastWeights[exercise.id]} kg
                                    </span>
                                </div>
                            )}

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 'var(--spacing-sm)',
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-input)',
                                borderRadius: 'var(--radius-md)'
                            }}>
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.75rem',
                                        marginBottom: '4px'
                                    }}>
                                        <Repeat size={14} />
                                        <span>Series</span>
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                        {exercise.sets}
                                    </div>
                                </div>

                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.75rem',
                                        marginBottom: '4px'
                                    }}>
                                        <TrendingUp size={14} />
                                        <span>RIR</span>
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                        {exercise.rir}
                                    </div>
                                </div>

                                <div>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.75rem',
                                        marginBottom: '4px'
                                    }}>
                                        <Clock size={14} />
                                        <span>Desc.</span>
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                        {exercise.rest}
                                    </div>
                                </div>
                            </div>
                        </div>
                        </div>
                        );
                    })}
                </div>

                {/* Add Exercise Button */}
                <button
                    onClick={handleAddClick}
                    className="btn btn-secondary dashed-border"
                    style={{
                        width: '100%',
                        marginTop: 'var(--spacing-lg)',
                        padding: 'var(--spacing-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--spacing-md)',
                        color: 'var(--text-secondary)',
                        marginBottom: 'var(--spacing-2xl)'
                    }}
                >
                    <Plus size={24} />
                    <span>Añadir Ejercicio</span>
                </button>
            </div>

            <ExerciseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveExercise}
                initialData={editingExercise}
            />

            {/* Delete Confirmation Modal */}
            <AppModal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                type="danger"
                title="Eliminar ejercicio"
                message={deleteTarget ? `¿Seguro que quieres eliminar "${deleteTarget.name}"?\nEsta acción no se puede deshacer.` : ''}
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeleteTarget(null)}
            />

            {/* Error Modal */}
            <AppModal
                isOpen={!!errorMsg}
                onClose={() => setErrorMsg('')}
                type="error"
                title="Error"
                message={errorMsg}
                hideCancel
            />

            {/* Exercise Detail Modal */}
            {detailExercise && (
                <div
                    onClick={() => setDetailExercise(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--spacing-md)'
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="animate-slideUp"
                        style={{
                            background: 'var(--surface-1, var(--bg-card))',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--spacing-xl)',
                            maxWidth: '440px',
                            width: '100%',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                            position: 'relative'
                        }}
                    >
                        {/* Close */}
                        <button
                            onClick={() => setDetailExercise(null)}
                            style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>

                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-lg)'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'rgba(34, 211, 166, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <Dumbbell size={24} style={{ color: 'var(--accent, #22D3A6)' }} />
                            </div>
                            <h3 style={{ margin: 0 }}>{detailExercise.name}</h3>
                        </div>

                        {/* Exercise GIF / Image */}
                        {(() => {
                            const gifUrl = getExerciseGifUrl(detailExercise.name);
                            if (gifUrl && !gifError) {
                                return (
                                    <div style={{
                                        borderRadius: 'var(--radius-md)',
                                        overflow: 'hidden',
                                        marginBottom: 'var(--spacing-lg)',
                                        background: 'var(--bg-input, rgba(255,255,255,0.05))',
                                        border: '1px solid var(--border)'
                                    }}>
                                        <img
                                            src={gifUrl}
                                            alt={detailExercise.name}
                                            onError={() => setGifError(true)}
                                            style={{
                                                width: '100%',
                                                height: 'auto',
                                                display: 'block',
                                                maxHeight: '280px',
                                                objectFit: 'contain',
                                                background: '#1a1a2e'
                                            }}
                                        />
                                    </div>
                                );
                            }
                            return (
                                <div style={{
                                    borderRadius: 'var(--radius-md)',
                                    overflow: 'hidden',
                                    marginBottom: 'var(--spacing-lg)',
                                    background: 'var(--bg-input, rgba(255,255,255,0.05))',
                                    border: '1px dashed var(--border)',
                                    padding: 'var(--spacing-xl)',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-sm)' }}>🏋️</div>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: 0 }}>
                                        GIF del ejercicio próximamente
                                    </p>
                                </div>
                            );
                        })()}

                        {/* Exercise Info */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 'var(--spacing-sm)',
                            padding: 'var(--spacing-md)',
                            background: 'var(--bg-input, rgba(255,255,255,0.05))',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: 'var(--spacing-lg)'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Series</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{detailExercise.sets}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Reps</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{detailExercise.reps}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Descanso</div>
                                <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{detailExercise.rest}</div>
                            </div>
                        </div>

                        {detailExercise.rir && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: 'var(--bg-input, rgba(255,255,255,0.05))',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-lg)',
                                fontSize: '0.875rem'
                            }}>
                                <span style={{ color: 'var(--text-muted)' }}>RIR objetivo</span>
                                <span style={{ fontWeight: 600 }}>{detailExercise.rir}</span>
                            </div>
                        )}

                        {detailExercise.block && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: 'var(--bg-input, rgba(255,255,255,0.05))',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-lg)',
                                fontSize: '0.875rem'
                            }}>
                                <span style={{ color: 'var(--text-muted)' }}>Bloque</span>
                                <span style={{ fontWeight: 600 }}>{detailExercise.block}</span>
                            </div>
                        )}

                        {detailExercise.notes && (
                            <div style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--bg-input, rgba(255,255,255,0.05))',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: 'var(--spacing-lg)',
                                fontSize: '0.875rem',
                                fontStyle: 'italic',
                                color: 'var(--text-secondary)'
                            }}>
                                📝 {detailExercise.notes}
                            </div>
                        )}

                        {/* History */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-sm)',
                            marginBottom: 'var(--spacing-md)'
                        }}>
                            <History size={18} style={{ color: 'var(--text-muted)' }} />
                            <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Últimas series</h4>
                        </div>

                        {detailHistory.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                                {detailHistory.map((set, i) => (
                                    <div
                                        key={set.id || i}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: 'var(--spacing-sm) var(--spacing-md)',
                                            background: 'var(--bg-input, rgba(255,255,255,0.05))',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <span style={{ color: 'var(--text-muted)', minWidth: '70px' }}>
                                            {new Date(set.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                        </span>
                                        <span style={{ fontWeight: 600 }}>
                                            {set.weight} kg × {set.reps} reps
                                        </span>
                                        {set.rpe && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                RPE {set.rpe}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{
                                textAlign: 'center',
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                                padding: 'var(--spacing-lg) 0'
                            }}>
                                Sin historial todavía. ¡Empieza una sesión!
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
