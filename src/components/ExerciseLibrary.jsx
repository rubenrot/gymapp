import { useState, useMemo } from 'react';
import { ArrowLeft, Search, ChevronDown, ChevronRight, Dumbbell, X } from 'lucide-react';
import exercisesData from '../../fitcron_exercises.json';

const DIFFICULTY_LABELS = {
    1: { label: 'Principiante', emoji: '🟢', color: 'var(--success)' },
    2: { label: 'Intermedio', emoji: '🟡', color: 'var(--warning)' },
    3: { label: 'Avanzado', emoji: '🔴', color: 'var(--error)' }
};


function getEquipmentCategory(equipmentList) {
    if (!equipmentList || equipmentList.length === 0) return 'Sin equipamiento';
    for (const equip of equipmentList) {
        // Check with accent-safe matching
        const normalized = equip.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        if (['mancuernas', 'barra larga', 'barra z'].includes(normalized)) return 'Peso libre';
        if (['maquina', 'polea', 'banco scott'].includes(normalized)) return 'Máquina / Polea';
        if (['banco plano', 'banco inclinable'].includes(normalized)) return 'Banco';
        if (['bandas', 'fitball', 'otro'].includes(normalized)) return 'Accesorios';
        if (normalized === 'ninguno') return 'Sin equipamiento';
    }
    return 'Otro';
}

const MUSCLE_GROUP_EMOJIS = {
    'Abdomen': '🎯',
    'Antebrazo': '💪',
    'Bíceps': '💪',
    'Cuello': '🦒',
    'Espalda': '🔙',
    'Hombro': '🏔️',
    'Pecho': '🫁',
    'Pierna': '🦵',
    'Todos': '⚡',
    'Tríceps': '💪'
};

// Fix encoding issues in data (Bceps -> Bíceps, Trceps -> Tríceps, Mquina -> Máquina)
function fixEncoding(str) {
    if (!str) return str;
    return str
        .replace(/Bceps/g, 'Bíceps')
        .replace(/Trceps/g, 'Tríceps')
        .replace(/Mquina/g, 'Máquina');
}

function fixExercise(exercise) {
    return {
        ...exercise,
        muscleGroup: fixEncoding(exercise.muscleGroup),
        equipment: exercise.equipment?.map(fixEncoding) || [],
        involvedMuscles: exercise.involvedMuscles?.map(fixEncoding) || []
    };
}

export default function ExerciseLibrary({ onBack }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});
    const [expandedLevels, setExpandedLevels] = useState({});
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [filterMuscle, setFilterMuscle] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');
    const [filterEquipment, setFilterEquipment] = useState('');

    // Fix encoding and process all exercises
    const exercises = useMemo(() => exercisesData.map(fixExercise), []);

    // Get unique muscle groups
    const muscleGroups = useMemo(() =>
        [...new Set(exercises.map(e => e.muscleGroup))].sort(),
        [exercises]
    );

    // Filter exercises by search and filters
    const filteredExercises = useMemo(() => {
        return exercises.filter(ex => {
            const matchesSearch = !searchQuery ||
                ex.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesMuscle = !filterMuscle || ex.muscleGroup === filterMuscle;
            const matchesDifficulty = !filterDifficulty || ex.difficulty === parseInt(filterDifficulty);
            const matchesEquipment = !filterEquipment ||
                getEquipmentCategory(ex.equipment) === filterEquipment;
            return matchesSearch && matchesMuscle && matchesDifficulty && matchesEquipment;
        });
    }, [exercises, searchQuery, filterMuscle, filterDifficulty, filterEquipment]);

    // Group exercises: muscleGroup → difficulty → equipmentCategory
    const groupedExercises = useMemo(() => {
        const groups = {};
        for (const ex of filteredExercises) {
            const mg = ex.muscleGroup;
            const diff = ex.difficulty;
            const equipCat = getEquipmentCategory(ex.equipment);

            if (!groups[mg]) groups[mg] = {};
            if (!groups[mg][diff]) groups[mg][diff] = {};
            if (!groups[mg][diff][equipCat]) groups[mg][diff][equipCat] = [];
            groups[mg][diff][equipCat].push(ex);
        }
        return groups;
    }, [filteredExercises]);

    const toggleGroup = (key) => setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    const toggleLevel = (key) => setExpandedLevels(prev => ({ ...prev, [key]: !prev[key] }));

    const hasActiveFilters = filterMuscle || filterDifficulty || filterEquipment;

    function clearFilters() {
        setFilterMuscle('');
        setFilterDifficulty('');
        setFilterEquipment('');
        setSearchQuery('');
    }

    // Equipment category labels for filter
    const equipmentCategoryLabels = ['Peso libre', 'Máquina / Polea', 'Banco', 'Accesorios', 'Sin equipamiento'];

    return (
        <div className="animate-fadeIn" style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
            {/* Header */}
            <div style={{
                background: 'var(--gradient-accent)',
                padding: 'var(--spacing-lg)',
                position: 'sticky',
                top: 0,
                zIndex: 100
            }}>
                <div className="container">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <button
                            onClick={onBack}
                            className="btn-icon"
                            style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h3 style={{ color: 'white', margin: 0 }}>Biblioteca de Ejercicios</h3>
                            <p style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '0.8rem',
                                margin: 0,
                                marginTop: '2px'
                            }}>
                                {filteredExercises.length} ejercicios
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container" style={{ padding: 'var(--spacing-md)' }}>
                {/* Search Bar */}
                <div style={{ position: 'relative', marginBottom: 'var(--spacing-md)' }}>
                    <Search
                        size={18}
                        style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-muted)'
                        }}
                    />
                    <input
                        type="text"
                        className="input"
                        placeholder="Buscar ejercicio..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            paddingLeft: '40px',
                            fontSize: '0.95rem'
                        }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '4px'
                            }}
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-md)',
                    flexWrap: 'wrap'
                }}>
                    <select
                        className="input"
                        value={filterMuscle}
                        onChange={(e) => setFilterMuscle(e.target.value)}
                        style={{ flex: '1', minWidth: '120px', fontSize: '0.8rem', padding: '8px' }}
                    >
                        <option value="">Músculo</option>
                        {muscleGroups.map(mg => (
                            <option key={mg} value={mg}>{MUSCLE_GROUP_EMOJIS[mg] || '💪'} {mg}</option>
                        ))}
                    </select>

                    <select
                        className="input"
                        value={filterDifficulty}
                        onChange={(e) => setFilterDifficulty(e.target.value)}
                        style={{ flex: '1', minWidth: '120px', fontSize: '0.8rem', padding: '8px' }}
                    >
                        <option value="">Nivel</option>
                        {[1, 2, 3].map(d => (
                            <option key={d} value={d}>
                                {DIFFICULTY_LABELS[d].emoji} {DIFFICULTY_LABELS[d].label}
                            </option>
                        ))}
                    </select>

                    <select
                        className="input"
                        value={filterEquipment}
                        onChange={(e) => setFilterEquipment(e.target.value)}
                        style={{ flex: '1', minWidth: '120px', fontSize: '0.8rem', padding: '8px' }}
                    >
                        <option value="">Equipo</option>
                        {equipmentCategoryLabels.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        style={{
                            background: 'var(--surface-2)',
                            border: '1px solid var(--border)',
                            color: 'var(--accent)',
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            marginBottom: 'var(--spacing-md)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <X size={14} />
                        Limpiar filtros
                    </button>
                )}

                {/* Grouped Exercise List */}
                {Object.keys(groupedExercises).length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🔍</div>
                        <p style={{ color: 'var(--text-secondary)' }}>No se encontraron ejercicios</p>
                        <button onClick={clearFilters} className="btn btn-secondary" style={{ marginTop: 'var(--spacing-md)' }}>
                            Limpiar filtros
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                        {Object.keys(groupedExercises).sort().map(muscleGroup => {
                            const mgKey = `mg-${muscleGroup}`;
                            const isExpanded = expandedGroups[mgKey];
                            const diffGroups = groupedExercises[muscleGroup];
                            const totalInGroup = Object.values(diffGroups).reduce(
                                (sum, eqGroup) => sum + Object.values(eqGroup).reduce((s, arr) => s + arr.length, 0), 0
                            );

                            return (
                                <div key={muscleGroup}>
                                    {/* Muscle Group Header */}
                                    <button
                                        onClick={() => toggleGroup(mgKey)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            background: 'var(--surface-1)',
                                            border: '1px solid var(--border)',
                                            borderRadius: 'var(--radius-lg)',
                                            cursor: 'pointer',
                                            color: 'var(--text-primary)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                            <span style={{ fontSize: '1.5rem' }}>
                                                {MUSCLE_GROUP_EMOJIS[muscleGroup] || '💪'}
                                            </span>
                                            <div style={{ textAlign: 'left' }}>
                                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                                                    {muscleGroup}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    {totalInGroup} ejercicios
                                                </div>
                                            </div>
                                        </div>
                                        {isExpanded
                                            ? <ChevronDown size={20} style={{ color: 'var(--accent)' }} />
                                            : <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
                                        }
                                    </button>

                                    {/* Difficulty Levels */}
                                    {isExpanded && (
                                        <div style={{
                                            marginTop: 'var(--spacing-xs)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 'var(--spacing-xs)'
                                        }}>
                                            {[1, 2, 3].filter(d => diffGroups[d]).map(difficulty => {
                                                const lvlKey = `${mgKey}-d${difficulty}`;
                                                const isLvlExpanded = expandedLevels[lvlKey];
                                                const equipGroups = diffGroups[difficulty];
                                                const totalInLevel = Object.values(equipGroups).reduce((s, arr) => s + arr.length, 0);

                                                return (
                                                    <div key={difficulty}>
                                                        <button
                                                            onClick={() => toggleLevel(lvlKey)}
                                                            style={{
                                                                width: '100%',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'space-between',
                                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                                background: 'var(--surface-2)',
                                                                border: '1px solid var(--border)',
                                                                borderRadius: 'var(--radius-md)',
                                                                cursor: 'pointer',
                                                                color: 'var(--text-primary)',
                                                                transition: 'all 0.2s ease'
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                                <span style={{
                                                                    width: '10px',
                                                                    height: '10px',
                                                                    borderRadius: '50%',
                                                                    background: DIFFICULTY_LABELS[difficulty].color,
                                                                    display: 'inline-block'
                                                                }} />
                                                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                                                    {DIFFICULTY_LABELS[difficulty].label}
                                                                </span>
                                                                <span style={{
                                                                    fontSize: '0.75rem',
                                                                    color: 'var(--text-muted)',
                                                                    background: 'var(--bg-input)',
                                                                    padding: '2px 8px',
                                                                    borderRadius: 'var(--radius-full)'
                                                                }}>
                                                                    {totalInLevel}
                                                                </span>
                                                            </div>
                                                            {isLvlExpanded
                                                                ? <ChevronDown size={16} style={{ color: 'var(--accent)' }} />
                                                                : <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                                            }
                                                        </button>

                                                        {/* Equipment Categories — auto-expanded with exercise cards grid */}
                                                        {isLvlExpanded && (
                                                            <div style={{
                                                                marginTop: 'var(--spacing-sm)',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: 'var(--spacing-md)'
                                                            }}>
                                                                {Object.keys(equipGroups).sort().map(equipCat => {
                                                                    const exercisesList = equipGroups[equipCat];

                                                                    return (
                                                                        <div key={equipCat}>
                                                                            {/* Equipment section header */}
                                                                            <div style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '6px',
                                                                                marginBottom: 'var(--spacing-sm)',
                                                                                paddingBottom: '4px',
                                                                                borderBottom: '1px solid var(--border)'
                                                                            }}>
                                                                                <Dumbbell size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                                                                                <span style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                                                    {equipCat}
                                                                                </span>
                                                                                <span style={{
                                                                                    fontSize: '0.65rem',
                                                                                    color: 'var(--text-muted)',
                                                                                    background: 'var(--surface-1)',
                                                                                    padding: '1px 6px',
                                                                                    borderRadius: 'var(--radius-full)'
                                                                                }}>
                                                                                    {exercisesList.length}
                                                                                </span>
                                                                            </div>

                                                                            {/* Exercise cards grid */}
                                                                            <div style={{
                                                                                display: 'grid',
                                                                                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                                                                                gap: '8px',
                                                                                maxWidth: '100%'
                                                                            }}>
                                                                                {exercisesList.sort((a, b) => a.name.localeCompare(b.name)).map((exercise, idx) => (
                                                                                    <button
                                                                                        key={`${exercise.slug}-${idx}`}
                                                                                        onClick={() => setSelectedExercise(exercise)}
                                                                                        style={{
                                                                                            display: 'flex',
                                                                                            flexDirection: 'column',
                                                                                            alignItems: 'center',
                                                                                            padding: '6px',
                                                                                            background: 'var(--bg-input)',
                                                                                            border: '1px solid var(--border)',
                                                                                            borderRadius: 'var(--radius-lg)',
                                                                                            cursor: 'pointer',
                                                                                            color: 'var(--text-primary)',
                                                                                            transition: 'all 0.2s ease',
                                                                                            overflow: 'hidden',
                                                                                            width: '100%'
                                                                                        }}
                                                                                    >
                                                                                        {/* GIF thumbnail */}
                                                                                        <div style={{
                                                                                            width: '100%',
                                                                                            aspectRatio: '1',
                                                                                            borderRadius: 'var(--radius-md)',
                                                                                            overflow: 'hidden',
                                                                                            background: 'var(--surface-2)',
                                                                                            display: 'flex',
                                                                                            alignItems: 'center',
                                                                                            justifyContent: 'center',
                                                                                            marginBottom: '4px'
                                                                                        }}>
                                                                                            {exercise.gifUrl ? (
                                                                                                <img
                                                                                                    src={exercise.gifUrl}
                                                                                                    alt={exercise.name}
                                                                                                    loading="lazy"
                                                                                                    style={{
                                                                                                        width: '100%',
                                                                                                        height: '100%',
                                                                                                        objectFit: 'contain'
                                                                                                    }}
                                                                                                    onError={(e) => {
                                                                                                        e.target.style.display = 'none';
                                                                                                        e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                                                                                                    }}
                                                                                                />
                                                                                            ) : null}
                                                                                            <div style={{
                                                                                                display: exercise.gifUrl ? 'none' : 'flex',
                                                                                                alignItems: 'center',
                                                                                                justifyContent: 'center',
                                                                                                width: '100%',
                                                                                                height: '100%'
                                                                                            }}>
                                                                                                <Dumbbell size={20} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                                                                                            </div>
                                                                                        </div>
                                                                                        {/* Name */}
                                                                                        <span style={{
                                                                                            fontSize: '0.6rem',
                                                                                            lineHeight: 1.2,
                                                                                            textAlign: 'center',
                                                                                            color: 'var(--text-secondary)',
                                                                                            display: '-webkit-box',
                                                                                            WebkitLineClamp: 2,
                                                                                            WebkitBoxOrient: 'vertical',
                                                                                            overflow: 'hidden',
                                                                                            width: '100%',
                                                                                            fontWeight: 500
                                                                                        }}>
                                                                                            {exercise.name}
                                                                                        </span>
                                                                                    </button>
                                                                                ))}
                                                                            </div>
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
                        })}
                    </div>
                )}
            </div>

            {/* Exercise Detail Modal */}
            {selectedExercise && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--spacing-md)',
                        animation: 'fadeIn 0.2s ease'
                    }}
                    onClick={() => setSelectedExercise(null)}
                >
                    <div
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-xl)',
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            border: '1px solid var(--border)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div style={{
                            padding: 'var(--spacing-lg)',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            position: 'sticky',
                            top: 0,
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
                            zIndex: 1
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', paddingRight: 'var(--spacing-md)' }}>
                                {selectedExercise.name}
                            </h3>
                            <button
                                onClick={() => setSelectedExercise(null)}
                                className="btn-icon"
                                style={{
                                    background: 'var(--surface-2)',
                                    color: 'var(--text-muted)',
                                    flexShrink: 0
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* GIF */}
                        {selectedExercise.gifUrl && (
                            <div style={{
                                padding: 'var(--spacing-md)',
                                display: 'flex',
                                justifyContent: 'center',
                                background: 'var(--bg-input)'
                            }}>
                                <img
                                    src={selectedExercise.gifUrl}
                                    alt={selectedExercise.name}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '300px',
                                        borderRadius: 'var(--radius-lg)',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}

                        {/* Details */}
                        <div style={{ padding: 'var(--spacing-lg)' }}>
                            {/* Badges */}
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 'var(--spacing-sm)',
                                marginBottom: 'var(--spacing-lg)'
                            }}>
                                <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                                    {selectedExercise.muscleGroup}
                                </span>
                                <span style={{
                                    fontSize: '0.8rem',
                                    padding: '4px 10px',
                                    borderRadius: 'var(--radius-full)',
                                    background: DIFFICULTY_LABELS[selectedExercise.difficulty]?.color || 'var(--text-muted)',
                                    color: 'white',
                                    fontWeight: 600
                                }}>
                                    {DIFFICULTY_LABELS[selectedExercise.difficulty]?.label}
                                </span>
                                <span className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                                    {selectedExercise.exerciseType}
                                </span>
                            </div>

                            {/* Info rows */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                <div style={{
                                    background: 'var(--bg-input)',
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        Músculos involucrados
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                        {selectedExercise.involvedMuscles?.join(', ') || 'N/A'}
                                    </div>
                                </div>

                                <div style={{
                                    background: 'var(--bg-input)',
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                                        Equipamiento
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                        {selectedExercise.equipment?.join(', ') || 'Ninguno'}
                                    </div>
                                </div>
                            </div>

                            {/* Link to source */}
                            {selectedExercise.url && (
                                <a
                                    href={selectedExercise.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'block',
                                        marginTop: 'var(--spacing-lg)',
                                        textAlign: 'center',
                                        color: 'var(--accent)',
                                        fontSize: '0.85rem',
                                        textDecoration: 'none'
                                    }}
                                >
                                    Ver en Fitcron →
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

