import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Scale, Plus, Pencil, Trash2, X } from 'lucide-react';
import {
    getWorkouts,
    getExercisesByWorkout,
    getProgressData,
    getBodyMetrics,
    addBodyMetric,
    updateBodyMetric,
    deleteBodyMetric
} from '../db/database';
import AppModal from './AppModal';

const HEIGHT_KEY = 'userHeightCm';

function calculateBmi(weightKg, heightCm) {
    const heightM = Number(heightCm) / 100;
    if (!heightM || heightM <= 0) return null;
    return weightKg / (heightM * heightM);
}

function calculateMovingAverage(items, key, windowSize = 7) {
    return items.map((item, index) => {
        const start = Math.max(0, index - windowSize + 1);
        const windowItems = items.slice(start, index + 1);
        const avg = windowItems.reduce((sum, row) => sum + row[key], 0) / windowItems.length;
        return Number(avg.toFixed(2));
    });
}

export default function ProgressCharts() {
    const [activeTab, setActiveTab] = useState('strength');

    const [workouts, setWorkouts] = useState([]);
    const [selectedWorkout, setSelectedWorkout] = useState(null);
    const [exercises, setExercises] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState(null);
    const [progressData, setProgressData] = useState([]);
    const [stats, setStats] = useState(null);

    const [bodyMetrics, setBodyMetrics] = useState([]);
    const heightCm = localStorage.getItem(HEIGHT_KEY) || '';
    const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
    const [editingMetricId, setEditingMetricId] = useState(null);
    const [weightForm, setWeightForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        weightKg: '',
        notes: ''
    });
    const [weightMessage, setWeightMessage] = useState('');
    const [deleteMetricTarget, setDeleteMetricTarget] = useState(null);

    async function loadWorkouts() {
        const workoutList = await getWorkouts();
        setWorkouts(workoutList);
        if (workoutList.length > 0) {
            setSelectedWorkout(workoutList[0].id);
        }
    }

    async function loadExercises(workoutId) {
        const exerciseList = await getExercisesByWorkout(workoutId);
        setExercises(exerciseList);
        if (exerciseList.length > 0) {
            setSelectedExercise(exerciseList[0].id);
        } else {
            setSelectedExercise(null);
            setProgressData([]);
            setStats(null);
        }
    }

    async function loadProgress(exerciseId) {
        const data = await getProgressData(exerciseId, 90);
        setProgressData(data);

        if (data.length > 0) {
            const weights = data.map((d) => d.weight);
            const maxWeight = Math.max(...weights);
            const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
            const trend = data.length > 1
                ? ((data[data.length - 1].weight - data[0].weight) / data[0].weight * 100).toFixed(1)
                : 0;

            setStats({
                pr: maxWeight,
                average: avgWeight.toFixed(1),
                trend: parseFloat(trend),
                sessions: data.length
            });
        } else {
            setStats(null);
        }
    }

    async function loadBodyMetrics() {
        const rows = await getBodyMetrics(365);
        setBodyMetrics(rows);
    }

    useEffect(() => {
        const timerId = setTimeout(() => {
            loadWorkouts();
            loadBodyMetrics();
        }, 0);

        return () => clearTimeout(timerId);
    }, []);

    useEffect(() => {
        if (!selectedWorkout) return undefined;

        const timerId = setTimeout(() => {
            loadExercises(selectedWorkout);
        }, 0);

        return () => clearTimeout(timerId);
    }, [selectedWorkout]);

    useEffect(() => {
        if (!selectedExercise) return undefined;

        const timerId = setTimeout(() => {
            loadProgress(selectedExercise);
        }, 0);

        return () => clearTimeout(timerId);
    }, [selectedExercise]);

    function openAddWeightModal() {
        setEditingMetricId(null);
        setWeightForm({
            date: new Date().toISOString().slice(0, 10),
            weightKg: '',
            notes: ''
        });
        setWeightMessage('');
        setIsWeightModalOpen(true);
    }

    function openEditWeightModal(metric) {
        setEditingMetricId(metric.id);
        setWeightForm({
            date: metric.date,
            weightKg: String(metric.weightKg),
            notes: metric.notes || ''
        });
        setWeightMessage('');
        setIsWeightModalOpen(true);
    }

    async function handleSaveWeight() {
        const numericWeight = Number(weightForm.weightKg);
        if (!numericWeight || numericWeight <= 0) {
            setWeightMessage('El peso debe ser mayor que 0.');
            return;
        }

        if (!weightForm.date) {
            setWeightMessage('Selecciona una fecha valida.');
            return;
        }

        try {
            if (editingMetricId) {
                await updateBodyMetric(editingMetricId, {
                    date: weightForm.date,
                    weightKg: numericWeight,
                    notes: weightForm.notes
                });
            } else {
                await addBodyMetric({
                    date: weightForm.date,
                    weightKg: numericWeight,
                    notes: weightForm.notes
                });
            }

            setIsWeightModalOpen(false);
            await loadBodyMetrics();
        } catch (error) {
            setWeightMessage(error.message || 'No se pudo guardar el peso.');
        }
    }

    async function handleDeleteMetric(metricId) {
        setDeleteMetricTarget(metricId);
    }

    async function doDeleteMetric() {
        if (!deleteMetricTarget) return;
        await deleteBodyMetric(deleteMetricTarget);
        setDeleteMetricTarget(null);
        await loadBodyMetrics();
    }

    const selectedExerciseName = exercises.find((e) => e.id === selectedExercise)?.name || '';

    const sortedBodyMetrics = useMemo(() => {
        return [...bodyMetrics].sort((a, b) => a.date.localeCompare(b.date));
    }, [bodyMetrics]);

    const weightChartData = useMemo(() => {
        const rows = sortedBodyMetrics.map((metric) => ({
            ...metric,
            bmi: calculateBmi(metric.weightKg, heightCm)
        }));

        const movingAverages = calculateMovingAverage(rows, 'weightKg', 7);

        return rows.map((row, index) => ({
            date: row.date,
            weightKg: row.weightKg,
            bmi: row.bmi ? Number(row.bmi.toFixed(2)) : null,
            weightAvg7: movingAverages[index]
        }));
    }, [sortedBodyMetrics, heightCm]);

    const latestWeight = sortedBodyMetrics.length > 0 ? sortedBodyMetrics[sortedBodyMetrics.length - 1] : null;
    const latestBmi = latestWeight ? calculateBmi(latestWeight.weightKg, heightCm) : null;

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Progreso</h2>

            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
                <button
                    onClick={() => setActiveTab('strength')}
                    className="btn"
                    style={{
                        background: activeTab === 'strength' ? 'var(--gradient-primary)' : 'var(--bg-card)',
                        color: 'white',
                        border: '1px solid var(--border)'
                    }}
                >
                    <TrendingUp size={18} />
                    Fuerza
                </button>
                <button
                    onClick={() => setActiveTab('body')}
                    className="btn"
                    style={{
                        background: activeTab === 'body' ? 'var(--gradient-primary)' : 'var(--bg-card)',
                        color: 'white',
                        border: '1px solid var(--border)'
                    }}
                >
                    <Scale size={18} />
                    Peso / IMC
                </button>
            </div>

            {activeTab === 'strength' && (
                <>
                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Rutina
                        </label>
                        <select
                            className="input"
                            value={selectedWorkout || ''}
                            onChange={(e) => setSelectedWorkout(parseInt(e.target.value, 10))}
                        >
                            {workouts.map((workout) => (
                                <option key={workout.id} value={workout.id}>
                                    {workout.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Ejercicio
                        </label>
                        <select
                            className="input"
                            value={selectedExercise || ''}
                            onChange={(e) => setSelectedExercise(parseInt(e.target.value, 10))}
                        >
                            {exercises.map((exercise) => (
                                <option key={exercise.id} value={exercise.id}>
                                    {exercise.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {stats && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                            gap: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-xl)'
                        }}>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>RÉCORD</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.pr} kg</div>
                            </div>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>PROMEDIO</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.average} kg</div>
                            </div>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>TENDENCIA</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stats.trend >= 0 ? 'var(--success)' : 'var(--error)' }}>
                                    {stats.trend > 0 ? '+' : ''}{stats.trend}%
                                </div>
                            </div>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-xs)' }}>SESIONES</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stats.sessions}</div>
                            </div>
                        </div>
                    )}

                    {progressData.length > 0 ? (
                        <div className="card">
                            <h4 style={{ marginBottom: 'var(--spacing-lg)' }}>Evolución de peso - {selectedExerciseName}</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={progressData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                                    <YAxis stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} label={{ value: 'kg', angle: -90, position: 'insideLeft', fill: 'var(--text-muted)' }} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }} />
                                    <Line type="monotone" dataKey="weight" stroke="url(#lineGradient)" strokeWidth={3} dot={{ fill: 'var(--primary)', r: 5 }} activeDot={{ r: 7 }} />
                                    <defs>
                                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="var(--primary)" />
                                            <stop offset="100%" stopColor="var(--secondary)" />
                                        </linearGradient>
                                    </defs>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                            <TrendingUp size={48} color="var(--text-muted)" style={{ margin: '0 auto var(--spacing-md)' }} />
                            <p style={{ color: 'var(--text-muted)' }}>
                                No hay datos de progreso para este ejercicio.
                                <br />
                                ¡Completa algunas sesiones para ver tu evolución!
                            </p>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'body' && (
                <>
                    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <h4 style={{ margin: 0 }}>Peso corporal e IMC</h4>
                            <button onClick={openAddWeightModal} className="btn btn-primary">
                                <Plus size={18} />
                                Añadir peso
                            </button>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 0 }}>
                            Altura actual para IMC: {heightCm || 'No configurada'} cm
                        </p>
                    </div>

                    {latestWeight && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))',
                            gap: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-lg)'
                        }}>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ULTIMO PESO</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>{latestWeight.weightKg} kg</div>
                            </div>
                            <div className="card" style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>IMC ACTUAL</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{latestBmi ? latestBmi.toFixed(1) : '--'}</div>
                            </div>
                        </div>
                    )}

                    {weightChartData.length > 0 ? (
                        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <h4 style={{ marginBottom: 'var(--spacing-lg)' }}>Evolución de peso e IMC</h4>
                            <ResponsiveContainer width="100%" height={320}>
                                <LineChart data={weightChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                                    <YAxis yAxisId="weight" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                                    <YAxis yAxisId="bmi" orientation="right" stroke="var(--text-muted)" style={{ fontSize: '0.75rem' }} />
                                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }} />
                                    <Line yAxisId="weight" type="monotone" dataKey="weightKg" name="Peso (kg)" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
                                    <Line yAxisId="weight" type="monotone" dataKey="weightAvg7" name="Media movil 7" stroke="var(--warning)" strokeWidth={2} dot={false} />
                                    <Line yAxisId="bmi" type="monotone" dataKey="bmi" name="IMC" stroke="var(--success)" strokeWidth={2} dot={false} connectNulls />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', marginBottom: 'var(--spacing-lg)' }}>
                            <Scale size={48} color="var(--text-muted)" style={{ margin: '0 auto var(--spacing-md)' }} />
                            <p style={{ color: 'var(--text-muted)' }}>
                                Aun no hay registros de peso.
                                <br />
                                Usa "Añadir peso" para empezar.
                            </p>
                        </div>
                    )}

                    {sortedBodyMetrics.length > 0 && (
                        <div className="card">
                            <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Registros</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {[...sortedBodyMetrics].reverse().slice(0, 20).map((metric) => (
                                    <div key={metric.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                                        <div>
                                            <strong>{metric.weightKg} kg</strong>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                {metric.date}{metric.notes ? ` - ${metric.notes}` : ''}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                            <button onClick={() => openEditWeightModal(metric)} className="btn-icon" style={{ background: 'rgba(255,255,255,0.12)', color: 'white' }} title="Editar">
                                                <Pencil size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteMetric(metric.id)} className="btn-icon" style={{ background: 'rgba(244, 67, 54, 0.2)', color: '#ff4444' }} title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {isWeightModalOpen && (
                <div className="modal-overlay" onClick={() => setIsWeightModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                            <h3 style={{ margin: 0 }}>{editingMetricId ? 'Editar peso' : 'Añadir peso'}</h3>
                            <button className="btn-icon btn-secondary" onClick={() => setIsWeightModalOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Fecha</label>
                                <input
                                    type="date"
                                    className="input"
                                    value={weightForm.date}
                                    onChange={(e) => setWeightForm((prev) => ({ ...prev, date: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Peso (kg)</label>
                                <input
                                    type="number"
                                    className="input"
                                    min="0.1"
                                    step="0.1"
                                    value={weightForm.weightKg}
                                    onChange={(e) => setWeightForm((prev) => ({ ...prev, weightKg: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Notas</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={weightForm.notes}
                                    onChange={(e) => setWeightForm((prev) => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        {weightMessage && (
                            <p style={{ color: 'var(--error)', marginTop: 'var(--spacing-md)', marginBottom: 0 }}>{weightMessage}</p>
                        )}

                        <button onClick={handleSaveWeight} className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}>
                            {editingMetricId ? 'Guardar cambios' : 'Guardar peso'}
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Weight Record Modal */}
            <AppModal
                isOpen={!!deleteMetricTarget}
                onClose={() => setDeleteMetricTarget(null)}
                type="danger"
                title="Eliminar registro"
                message="¿Eliminar este registro de peso? Esta acción no se puede deshacer."
                onConfirm={doDeleteMetric}
                onCancel={() => setDeleteMetricTarget(null)}
            />
        </div>
    );
}
