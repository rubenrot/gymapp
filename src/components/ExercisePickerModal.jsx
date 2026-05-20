import { useState, useMemo, useCallback } from 'react';
import { Search, X, ChevronDown, ChevronRight, Dumbbell, Check } from 'lucide-react';
import exercisesData from '../../fitcron_exercises.json';

const DIFFICULTY_LABELS = {
    1: { label: 'Principiante', emoji: '🟢', color: 'var(--success)' },
    2: { label: 'Intermedio', emoji: '🟡', color: 'var(--warning)' },
    3: { label: 'Avanzado', emoji: '🔴', color: 'var(--error)' }
};

const MUSCLE_GROUP_EMOJIS = {
    'Abdomen': '🎯', 'Antebrazo': '💪', 'Bíceps': '💪', 'Cuello': '🦒',
    'Espalda': '🔙', 'Hombro': '🏔️', 'Pecho': '🫁', 'Pierna': '🦵',
    'Todos': '⚡', 'Tríceps': '💪'
};

function fixEncoding(str) {
    if (!str) return str;
    return str.replace(/Bceps/g, 'Bíceps').replace(/Trceps/g, 'Tríceps').replace(/Mquina/g, 'Máquina');
}

function fixExercise(exercise) {
    return {
        ...exercise,
        muscleGroup: fixEncoding(exercise.muscleGroup),
        equipment: exercise.equipment?.map(fixEncoding) || [],
        involvedMuscles: exercise.involvedMuscles?.map(fixEncoding) || []
    };
}

function getEquipmentCategory(equipmentList) {
    if (!equipmentList || equipmentList.length === 0) return 'Sin equipamiento';
    for (const equip of equipmentList) {
        const normalized = equip.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (['mancuernas', 'barra larga', 'barra z'].includes(normalized)) return 'Peso libre';
        if (['maquina', 'polea', 'banco scott'].includes(normalized)) return 'Máquina / Polea';
        if (['banco plano', 'banco inclinable'].includes(normalized)) return 'Banco';
        if (['bandas', 'fitball', 'otro'].includes(normalized)) return 'Accesorios';
        if (normalized === 'ninguno') return 'Sin equipamiento';
    }
    return 'Otro';
}

export default function ExercisePickerModal({ isOpen, onClose, onSelect, currentExerciseName }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterMuscle, setFilterMuscle] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});

    const exercises = useMemo(() => exercisesData.map(fixExercise), []);

    const muscleGroups = useMemo(() =>
        [...new Set(exercises.map(e => e.muscleGroup))].sort(),
        [exercises]
    );

    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            const matchesSearch = !searchQuery ||
                ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                ex.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesMuscle = !filterMuscle || ex.muscleGroup === filterMuscle;
            return matchesSearch && matchesMuscle;
        });
    }, [exercises, searchQuery, filterMuscle]);

    // Group by muscleGroup
    const groupedByMuscle = useMemo(() => {
        const groups = {};
        for (const ex of filteredExercises) {
            if (!groups[ex.muscleGroup]) groups[ex.muscleGroup] = [];
            groups[ex.muscleGroup].push(ex);
        }
        return groups;
    }, [filteredExercises]);

    const toggleGroup = useCallback((key) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    const handleSelect = useCallback((exercise) => {
        onSelect({
            name: exercise.name,
            exerciseDbId: exercise.slug,
            gifUrl: exercise.gifUrl || '',
            muscleGroup: exercise.muscleGroup,
            equipment: exercise.equipment,
        });
    }, [onSelect]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(4px)',
                zIndex: 3000,
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeIn 0.2s ease'
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    maxWidth: '600px',
                    width: '100%',
                    margin: '0 auto',
                    background: 'var(--bg-primary, var(--bg-dark))',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    background: 'var(--gradient-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0
                }}>
                    <div>
                        <h3 style={{ color: 'white', margin: 0, fontSize: '1rem' }}>
                            Seleccionar Ejercicio
                        </h3>
                        {currentExerciseName && (
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', margin: '2px 0 0' }}>
                                Reemplazar: {currentExerciseName}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-icon"
                        style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
                    >
                        <X size={22} />
                    </button>
                </div>

                {/* Search + Filter */}
                <div style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    flexShrink: 0,
                    background: 'var(--surface-1)'
                }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{
                            position: 'absolute', left: '10px', top: '50%',
                            transform: 'translateY(-50%)', color: 'var(--text-muted)'
                        }} />
                        <input
                            type="text"
                            className="input"
                            placeholder="Buscar ejercicio..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ width: '100%', paddingLeft: '34px', fontSize: '0.85rem' }}
                            autoFocus
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                style={{
                                    position: 'absolute', right: '6px', top: '50%',
                                    transform: 'translateY(-50%)', background: 'none',
                                    border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px'
                                }}
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                    <select
                        className="input"
                        value={filterMuscle}
                        onChange={(e) => setFilterMuscle(e.target.value)}
                        style={{ minWidth: '100px', fontSize: '0.8rem', padding: '6px 8px' }}
                    >
                        <option value="">Todos</option>
                        {muscleGroups.map(mg => (
                            <option key={mg} value={mg}>{MUSCLE_GROUP_EMOJIS[mg] || '💪'} {mg}</option>
                        ))}
                    </select>
                </div>

                {/* Results */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        marginBottom: 'var(--spacing-sm)'
                    }}>
                        {filteredExercises.length} ejercicios encontrados
                    </p>

                    {/* If searching, show flat list */}
                    {searchQuery ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {filteredExercises.slice(0, 50).map((exercise, idx) => (
                                <ExercisePickerItem
                                    key={`${exercise.slug}-${idx}`}
                                    exercise={exercise}
                                    onSelect={handleSelect}
                                    isCurrent={exercise.name === currentExerciseName}
                                />
                            ))}
                            {filteredExercises.length > 50 && (
                                <p style={{
                                    textAlign: 'center',
                                    fontSize: '0.8rem',
                                    color: 'var(--text-muted)',
                                    padding: 'var(--spacing-md)'
                                }}>
                                    Mostrando 50 de {filteredExercises.length}. Refina tu búsqueda.
                                </p>
                            )}
                        </div>
                    ) : (
                        /* Grouped by muscle */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                            {Object.keys(groupedByMuscle).sort().map(mg => {
                                const isExpanded = expandedGroups[mg];
                                const items = groupedByMuscle[mg];
                                return (
                                    <div key={mg}>
                                        <button
                                            onClick={() => toggleGroup(mg)}
                                            style={{
                                                width: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                background: 'var(--surface-1)',
                                                border: '1px solid var(--border)',
                                                borderRadius: 'var(--radius-md)',
                                                cursor: 'pointer',
                                                color: 'var(--text-primary)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <span style={{ fontSize: '1.2rem' }}>
                                                    {MUSCLE_GROUP_EMOJIS[mg] || '💪'}
                                                </span>
                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{mg}</span>
                                                <span style={{
                                                    fontSize: '0.7rem', color: 'var(--text-muted)',
                                                    background: 'var(--bg-input)', padding: '2px 6px',
                                                    borderRadius: 'var(--radius-full)'
                                                }}>
                                                    {items.length}
                                                </span>
                                            </div>
                                            {isExpanded
                                                ? <ChevronDown size={18} style={{ color: 'var(--accent)' }} />
                                                : <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                                            }
                                        </button>

                                        {isExpanded && (
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '2px',
                                                marginTop: '4px',
                                                marginBottom: 'var(--spacing-sm)'
                                            }}>
                                                {items.sort((a, b) => a.name.localeCompare(b.name)).map((exercise, idx) => (
                                                    <ExercisePickerItem
                                                        key={`${exercise.slug}-${idx}`}
                                                        exercise={exercise}
                                                        onSelect={handleSelect}
                                                        isCurrent={exercise.name === currentExerciseName}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ExercisePickerItem({ exercise, onSelect, isCurrent }) {
    return (
        <button
            onClick={() => !isCurrent && onSelect(exercise)}
            style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: '8px 10px',
                background: isCurrent ? 'rgba(12, 230, 199, 0.1)' : 'var(--bg-input)',
                border: isCurrent ? '1px solid var(--accent)' : '1px solid transparent',
                borderRadius: 'var(--radius-md)',
                cursor: isCurrent ? 'default' : 'pointer',
                color: 'var(--text-primary)',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                opacity: isCurrent ? 0.7 : 1
            }}
        >
            {/* Thumbnail */}
            <div style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: 'var(--surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}>
                {exercise.gifUrl ? (
                    <img
                        src={exercise.gifUrl}
                        alt=""
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <Dumbbell size={16} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                )}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {exercise.name}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        background: 'var(--surface-1)',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)'
                    }}>
                        {exercise.muscleGroup}
                    </span>
                    {exercise.difficulty && DIFFICULTY_LABELS[exercise.difficulty] && (
                        <span style={{
                            width: '7px', height: '7px', borderRadius: '50%',
                            background: DIFFICULTY_LABELS[exercise.difficulty].color,
                            display: 'inline-block'
                        }} />
                    )}
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                        {getEquipmentCategory(exercise.equipment)}
                    </span>
                </div>
            </div>

            {/* Current indicator */}
            {isCurrent && (
                <div style={{
                    background: 'var(--accent)',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}>
                    <Check size={14} style={{ color: 'white' }} />
                </div>
            )}
        </button>
    );
}

