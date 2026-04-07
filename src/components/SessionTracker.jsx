import { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronLeft, ChevronRight, StickyNote, Pause, Pencil, CheckCheck } from 'lucide-react';
import {
    getExercisesByWorkout,
    createSession,
    addSet,
    updateSession,
    deleteSession,
    getSetsByExercise,
    getExerciseHistory
} from '../db/database';
import RestTimer from './RestTimer';
import NotesModal from './NotesModal';
import PrepTimer from './PrepTimer';
import { requestWakeLock, releaseWakeLock } from '../utils/wakeLock';
import { saveSession, clearSession } from '../utils/sessionStorage';
import { getExerciseGifUrl } from '../data/exerciseImages';
import AppModal from './AppModal';

export default function SessionTracker({ workout, onClose }) {
    const [exercises, setExercises] = useState([]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentSetNumber, setCurrentSetNumber] = useState(1);
    const [sessionId, setSessionId] = useState(null);
    const [weight, setWeight] = useState('');
    const [rpe, setRpe] = useState(null); // RPE 1-5 scale
    const [exercisePhase, setExercisePhase] = useState('input'); // 'input', 'executing', 'doing', 'rpe'
    const [sessionSets, setSessionSets] = useState({});
    const [showTimer, setShowTimer] = useState(false);
    const [timerDuration, setTimerDuration] = useState(90);
    const [showPrepTimer, setShowPrepTimer] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [lastWeights, setLastWeights] = useState({});
    const [lastSessionData, setLastSessionData] = useState({}); // { exerciseId: [{ weight, reps }, ...] }
    const [startTime] = useState(Date.now());
    const [gifError, setGifError] = useState(false);
    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [sessionDuration, setSessionDuration] = useState(0);
    const [setWeights, setSetWeights] = useState({}); // { setNumber: weight } per exercise
    const [setRepsMap, setSetRepsMap] = useState({}); // { setNumber: reps } per exercise
    const [editingSetNumber, setEditingSetNumber] = useState(null); // which set ball was tapped
    const [editSetWeight, setEditSetWeight] = useState('');
    const [editSetReps, setEditSetReps] = useState('');
    const [exerciseHistory, setExerciseHistory] = useState([]);
    const initRef = useRef(false);

    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
        initSession();
    }, [workout]);

    // Reset image error states when exercise changes
    useEffect(() => {
        setGifError(false);
    }, [currentExerciseIndex]);

    // Block navigation during active session
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '¿Seguro que quieres salir? Perderás el progreso de esta sesión.';
            return e.returnValue;
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Activate wake lock to keep screen on
        requestWakeLock();

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            // Release wake lock when component unmounts
            releaseWakeLock();
        };
    }, []);

    useEffect(() => {
        if (exercises.length > 0 && Object.keys(lastWeights).length > 0) {
            // Only auto-load weight when in input phase (avoid overwriting during active sets)
            if (exercisePhase === 'input') {
                loadLastWeight(exercises[currentExerciseIndex]);
            }
        }
    }, [currentExerciseIndex, exercises, lastWeights]);

    // Load exercise history (last 3 sessions) when exercise changes
    useEffect(() => {
        if (exercises.length > 0 && sessionId) {
            const exercise = exercises[currentExerciseIndex];
            getExerciseHistory(exercise.id, 1, sessionId).then(history => {
                console.log('Exercise history for', exercise.name, ':', history);
                setExerciseHistory(history);
            });
        }
    }, [currentExerciseIndex, exercises, sessionId]);

    async function initSession() {
        const exerciseList = await getExercisesByWorkout(workout.id);
        setExercises(exerciseList);

        // Check if resuming a paused session
        if (workout.savedSession) {
            const saved = workout.savedSession;

            // Restore all state
            setSessionId(saved.sessionId);
            setCurrentExerciseIndex(saved.currentExerciseIndex);
            setCurrentSetNumber(saved.currentSetNumber);
            setWeight(saved.weight || '');
            setRpe(saved.rpe);
            setExercisePhase(saved.exercisePhase || 'input');
            setSessionSets(saved.sessionSets || {});
            setSetWeights(saved.setWeights || {});
            setSetRepsMap(saved.setRepsMap || {});

            // Clear the saved session from localStorage
            clearSession();
        } else {
            // New session
            const id = await createSession(workout.id);
            setSessionId(id);
        }

        // Load last weights and last session data for all exercises
        const weights = {};
        const sessionData = {};
        for (const exercise of exerciseList) {
            const sets = await getSetsByExercise(exercise.id);
            if (sets.length > 0) {
                weights[exercise.id] = sets[0].weight;

                // Group by sessionId to get the most recent session's sets
                const bySession = {};
                for (const s of sets) {
                    if (!bySession[s.sessionId]) bySession[s.sessionId] = [];
                    bySession[s.sessionId].push(s);
                }
                // Get the session with the most recent date
                const sessions = Object.values(bySession);
                sessions.sort((a, b) => new Date(b[0].date) - new Date(a[0].date));
                const lastSets = sessions[0] || [];
                lastSets.sort((a, b) => a.setNumber - b.setNumber);
                sessionData[exercise.id] = lastSets.map(s => ({ weight: s.weight, reps: s.reps }));
            }
        }
        setLastWeights(weights);
        setLastSessionData(sessionData);

        // Set initial weight for the first exercise (or restored exercise)
        // Only if we're not resuming a paused session (which already has a weight)
        if (!workout.savedSession) {
            const firstExercise = exerciseList[0];
            if (firstExercise && weights[firstExercise.id]) {
                setWeight(weights[firstExercise.id].toString());
            }
        }
    }

    async function loadLastWeight(exercise) {
        if (lastWeights[exercise.id]) {
            setWeight(lastWeights[exercise.id].toString());
        } else {
            setWeight('');
        }
        setRpe(null); // Reset RPE for new exercise
    }

    function parseRestTime(restString) {
        if (!restString) return 60;
        // Match patterns like "90-120s", "75-90s", "60-75s", "90s", "2 min", "3-4 min"
        const rangeMatch = restString.match(/(\d+)\s*[-–]\s*(\d+)\s*s/i);
        if (rangeMatch) {
            // Use the average of the range in seconds
            return Math.round((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2);
        }
        const singleSecMatch = restString.match(/(\d+)\s*s/i);
        if (singleSecMatch) return parseInt(singleSecMatch[1]);
        const minMatch = restString.match(/(\d+)\s*min/i);
        if (minMatch) return parseInt(minMatch[1]) * 60;
        // Fallback: extract first number
        const num = restString.match(/(\d+)/);
        return num ? parseInt(num[1]) : 60;
    }

    // NEW WORKFLOW: Start all 5 sets for current exercise
    function startExerciseSets() {
        if (!weight) return;

        const exercise = exercises[currentExerciseIndex];
        const totalSets = parseInt(exercise.sets.match(/\d+/)[0]);
        const lastData = lastSessionData[exercise.id]; // array of { weight, reps } from last session

        // Initialize per-set weights: use last session per-set weights if available
        const initialWeights = {};
        for (let i = 1; i <= totalSets; i++) {
            initialWeights[i] = (lastData && lastData[i - 1]) ? lastData[i - 1].weight : parseFloat(weight);
        }
        setSetWeights(initialWeights);

        // Initialize per-set reps: use last session per-set reps if available, else template
        const repsMatch = exercise.reps.match(/(\d+)(?:-(\d+))?/);
        const templateReps = repsMatch
            ? (repsMatch[2] ? Math.round((parseInt(repsMatch[1]) + parseInt(repsMatch[2])) / 2) : parseInt(repsMatch[1]))
            : 10;
        const initialReps = {};
        for (let i = 1; i <= totalSets; i++) {
            initialReps[i] = (lastData && lastData[i - 1]) ? lastData[i - 1].reps : templateReps;
        }
        setSetRepsMap(initialReps);

        // Change to doing phase directly (no automatic prep timer)
        setExercisePhase('doing');
        setCurrentSetNumber(1);
    }

    // Called when PrepTimer completes - user must now do the set
    function handlePrepTimerComplete() {
        setShowPrepTimer(false);
        setEditingSetNumber(null);
        setExercisePhase('doing');
    }

    // Called when user confirms they finished the set
    function handleSetDone() {
        const exercise = exercises[currentExerciseIndex];
        const totalSets = parseInt(exercise.sets.match(/\d+/)[0]);

        if (currentSetNumber < totalSets) {
            // Go to executing phase (rest selection) without auto-starting timer
            setExercisePhase('executing');
        } else {
            // All sets done, move to RPE phase
            setExercisePhase('rpe');
        }
    }

    // Mark set as done AND start rest timer in one action
    function handleSetDoneWithRest(seconds) {
        const exercise = exercises[currentExerciseIndex];
        const totalSets = parseInt(exercise.sets.match(/\d+/)[0]);

        if (currentSetNumber < totalSets) {
            setExercisePhase('executing');
            setTimerDuration(seconds);
            setShowTimer(true);
        } else {
            setExercisePhase('rpe');
        }
    }

    // Called when RestTimer completes - move to next set directly
    function handleRestTimerComplete() {
        setShowTimer(false);
        setEditingSetNumber(null);
        setCurrentSetNumber(prev => prev + 1);
        setExercisePhase('doing');
    }

    // Submit RPE for all sets of current exercise
    async function submitExerciseRPE() {
        if (!rpe) return;

        const exercise = exercises[currentExerciseIndex];
        const totalSets = parseInt(exercise.sets.match(/\d+/)[0]);

        // Fallback target reps from template
        const repsMatch = exercise.reps.match(/(\d+)(?:-(\d+))?/);
        const fallbackReps = repsMatch ?
            (repsMatch[2] ? Math.round((parseInt(repsMatch[1]) + parseInt(repsMatch[2])) / 2) : parseInt(repsMatch[1]))
            : 10;

        // Save all sets with their individual weights, reps and same RPE
        for (let setNum = 1; setNum <= totalSets; setNum++) {
            const setWeight = setWeights[setNum] || parseFloat(weight);
            const setReps = setRepsMap[setNum] || fallbackReps;
            await addSet(
                sessionId,
                exercise.id,
                setNum,
                setWeight,
                setReps,
                exercise.rir,
                rpe
            );

            // Store in state
            const key = `${exercise.id}-${setNum}`;
            setSessionSets(prev => ({
                ...prev,
                [key]: { weight: setWeight, reps: setReps, rpe }
            }));
        }

        // Move to next exercise or complete workout
        if (currentExerciseIndex < exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
            setCurrentSetNumber(1);
            setExercisePhase('input');
            setWeight('');
            setRpe(null);
            setSetWeights({});
            setSetRepsMap({});

            // Load last weight for next exercise
            loadLastWeight(exercises[currentExerciseIndex + 1]);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Workout complete!
            await completeSession();
        }
    }

    async function completeSession() {
        // Check if any sets were actually recorded
        const setsRecorded = Object.keys(sessionSets).length > 0;

        if (!setsRecorded) {
            // No exercises done – delete the empty session
            await deleteSession(sessionId);
            clearSession();
            onClose();
            return;
        }

        const duration = Math.floor((Date.now() - startTime) / 1000 / 60); // minutes
        await updateSession(sessionId, { duration });

        // Clear saved session
        clearSession();

        // Show completion modal
        setSessionDuration(duration);
        setShowCompleteModal(true);
    }

    function handlePauseSession() {
        // Save current state
        const sessionData = {
            workoutId: workout.id,
            workoutName: workout.name,
            sessionId,
            currentExerciseIndex,
            currentSetNumber,
            weight,
            rpe,
            exercisePhase,
            sessionSets,
            setWeights,
            setRepsMap,
            startTime
        };

        saveSession(sessionData);

        // Release wake lock
        releaseWakeLock();

        // Close without completing
        onClose();
    }

    function handlePreviousExercise() {
        if (currentExerciseIndex > 0) {
            setShowTimer(false);
            setShowPrepTimer(false);
            setCurrentExerciseIndex(prev => prev - 1);
            setCurrentSetNumber(1);
            setExercisePhase('input');
            setRpe(null);
            setEditingSetNumber(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    function handleNextExercise() {
        if (currentExerciseIndex < exercises.length - 1) {
            setShowTimer(false);
            setShowPrepTimer(false);
            setCurrentExerciseIndex(prev => prev + 1);
            setCurrentSetNumber(1);
            setExercisePhase('input');
            setWeight('');
            setRpe(null);
            setEditingSetNumber(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Complete all remaining sets at once and jump to RPE
    function handleCompleteAllSets() {
        const exercise = exercises[currentExerciseIndex];
        const totalSets = parseInt(exercise.sets.match(/\d+/)[0]);

        // Close any active timer/prep overlay
        setShowTimer(false);
        setShowPrepTimer(false);

        // Mark the current set number as the last one (so progress dots show all green)
        setCurrentSetNumber(totalSets);

        // Jump directly to RPE phase
        setExercisePhase('rpe');
    }

    function handleSkipSet() {
        const exercise = exercises[currentExerciseIndex];
        const totalSets = parseInt(exercise.sets.match(/\d+/)[0]);

        // Close any active timer/prep overlay
        setShowTimer(false);
        setShowPrepTimer(false);

        if (currentSetNumber < totalSets) {
            // Skip to next set of same exercise
            setCurrentSetNumber(prev => prev + 1);
            setExercisePhase('doing');
        } else if (currentExerciseIndex < exercises.length - 1) {
            // Last set of this exercise → skip to next exercise
            setCurrentExerciseIndex(prev => prev + 1);
            setCurrentSetNumber(1);
            setExercisePhase('input');
            setWeight('');
            setRpe(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Last set of last exercise → complete workout
            completeSession();
        }
    }

    // Start rest timer with a chosen duration
    function startRestTimer(seconds) {
        setTimerDuration(seconds);
        setShowTimer(true);
    }

    // Open the set editor modal for a specific set number
    function openSetEditor(setNum) {
        setEditSetWeight(String(setWeights[setNum] || weight));
        setEditSetReps(String(setRepsMap[setNum] || ''));
        setEditingSetNumber(setNum);
    }

    // Apply edited values: mode = 'single' or 'remaining'
    function applySetEdit(mode) {
        const newWeight = parseFloat(editSetWeight) || 0;
        const newReps = parseInt(editSetReps) || 0;
        const setNum = editingSetNumber;

        if (mode === 'single') {
            setSetWeights(prev => ({ ...prev, [setNum]: newWeight }));
            setSetRepsMap(prev => ({ ...prev, [setNum]: newReps }));
        } else {
            setSetWeights(prev => {
                const updated = { ...prev };
                for (let i = setNum; i <= totalSets; i++) updated[i] = newWeight;
                return updated;
            });
            setSetRepsMap(prev => {
                const updated = { ...prev };
                for (let i = setNum; i <= totalSets; i++) updated[i] = newReps;
                return updated;
            });
            setWeight(String(newWeight));
        }

        setEditingSetNumber(null);
    }

    function handleSkipExercise() {
        setShowTimer(false);
        setShowPrepTimer(false);

        if (currentExerciseIndex < exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
            setCurrentSetNumber(1);
            setExercisePhase('input');
            setWeight('');
            setRpe(null);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // Last exercise → complete workout
            completeSession();
        }
    }

    if (exercises.length === 0) {
        return <div className="container" style={{ padding: 'var(--spacing-xl)' }}>
            <p>Cargando ejercicios...</p>
        </div>;
    }

    const currentExercise = exercises[currentExerciseIndex];
    const totalSets = parseInt(currentExercise.sets.match(/\d+/)[0]);
    const progress = ((currentExerciseIndex * totalSets + currentSetNumber - 1) /
        (exercises.reduce((sum, ex) => sum + parseInt(ex.sets.match(/\d+/)[0]), 0))) * 100;

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ color: 'white', margin: 0 }}>{workout.name}</h3>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button
                                onClick={handlePauseSession}
                                className="btn-icon"
                                style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                                title="Pausar sesión"
                            >
                                <Pause size={24} />
                            </button>
                            <button
                                onClick={onClose}
                                className="btn-icon"
                                style={{ background: 'rgba(255, 255, 255, 0.2)', color: 'white' }}
                                title="Cerrar (perderás el progreso)"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        marginTop: 'var(--spacing-md)',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 'var(--radius-full)',
                        height: '8px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            background: 'white',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>

                    <p style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '0.875rem',
                        marginTop: 'var(--spacing-sm)',
                        marginBottom: 0
                    }}>
                        Ejercicio {currentExerciseIndex + 1} de {exercises.length}
                    </p>
                </div>
            </div>

            <div className="container" style={{ padding: 'var(--spacing-xl) var(--spacing-md)' }}>
                {/* Exercise Image */}
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: 'var(--radius-xl)',
                    marginBottom: 'var(--spacing-xl)',
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                    padding: '12px 0'
                }}>
                    {(() => {
                        const exerciseGifUrl = getExerciseGifUrl(currentExercise.name);

                        if (exerciseGifUrl && !gifError) {
                            return (
                                <img
                                    src={exerciseGifUrl}
                                    alt={currentExercise.name}
                                    onError={() => setGifError(true)}
                                    style={{
                                        maxWidth: '250px',
                                        maxHeight: '250px',
                                        width: 'auto',
                                        height: 'auto',
                                        display: 'block',
                                        margin: '0 auto',
                                        objectFit: 'contain',
                                        borderRadius: '12px'
                                    }}
                                />
                            );
                        }

                        // Fallback placeholder
                        return (
                            <div style={{
                                padding: 'var(--spacing-xl)',
                                textAlign: 'center',
                                minHeight: '250px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column'
                            }}>
                                <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>💪</div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    {currentExercise.name}
                                </p>
                            </div>
                        );
                    })()}
                </div>

                {/* Exercise Info */}
                <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>{currentExercise.name}</h2>

                    <div style={{
                        display: 'flex',
                        gap: 'var(--spacing-md)',
                        marginBottom: 'var(--spacing-md)'
                    }}>
                        <div className="badge badge-primary" style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                            Serie {currentSetNumber} / {totalSets}
                        </div>
                        <div className="badge badge-success" style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                            {currentExercise.reps} reps
                        </div>
                        <div className="badge badge-warning" style={{ fontSize: '0.875rem', padding: 'var(--spacing-sm) var(--spacing-md)' }}>
                            RIR {currentExercise.rir}
                        </div>
                    </div>

                    {/* Last session data – compact */}
                    {exerciseHistory.length > 0 ? (() => {
                        const last = exerciseHistory[0];
                        const d = new Date(last.date);
                        const dateLabel = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                        const uniqueWeights = [...new Set(last.sets.map(s => s.weight))];
                        const summary = uniqueWeights.length === 1
                            ? `${uniqueWeights[0]}kg × ${last.sets.map(s => s.reps).join(' | ')}`
                            : last.sets.map(s => `${s.weight}×${s.reps}`).join(' | ');
                        return (
                            <div style={{
                                marginTop: 'var(--spacing-sm)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                fontSize: '0.8rem',
                                color: 'var(--text-secondary)'
                            }}>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: 'var(--text-muted)',
                                    flexShrink: 0
                                }}>
                                    Última sesión
                                </span>
                                <span style={{
                                    fontSize: '0.65rem',
                                    color: 'var(--text-muted)',
                                    background: 'var(--bg-input)',
                                    padding: '1px 6px',
                                    borderRadius: 'var(--radius-full)',
                                    flexShrink: 0
                                }}>
                                    {dateLabel}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{summary}</span>
                            </div>
                        );
                    })() : (
                        <p style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.75rem',
                            margin: 'var(--spacing-sm) 0 0',
                            fontStyle: 'italic'
                        }}>
                            Sin registros previos
                        </p>
                    )}
                </div>

                {/* Phase-based UI */}
                {exercisePhase === 'input' && (
                    <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        {/* Weight Input */}
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Peso (kg)
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="0"
                                step="0.5"
                                style={{ fontSize: '1.5rem', textAlign: 'center', width: '100%' }}
                            />
                        </div>

                        <button
                            onClick={startExerciseSets}
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%' }}
                            disabled={!weight}
                        >
                            Iniciar {totalSets} Series
                        </button>

                        <button
                            onClick={() => {
                                if (!weight) return;
                                const exercise = exercises[currentExerciseIndex];
                                const sets = parseInt(exercise.sets.match(/\d+/)[0]);
                                const lastData = lastSessionData[exercise.id];

                                // Initialize per-set weights from last session or input
                                const initialWeights = {};
                                for (let i = 1; i <= sets; i++) {
                                    initialWeights[i] = (lastData && lastData[i - 1]) ? lastData[i - 1].weight : parseFloat(weight);
                                }
                                setSetWeights(initialWeights);

                                // Initialize per-set reps from last session or template
                                const repsMatch = exercise.reps.match(/(\d+)(?:-(\d+))?/);
                                const templateReps = repsMatch
                                    ? (repsMatch[2] ? Math.round((parseInt(repsMatch[1]) + parseInt(repsMatch[2])) / 2) : parseInt(repsMatch[1]))
                                    : 10;
                                const initialReps = {};
                                for (let i = 1; i <= sets; i++) {
                                    initialReps[i] = (lastData && lastData[i - 1]) ? lastData[i - 1].reps : templateReps;
                                }
                                setSetRepsMap(initialReps);

                                setCurrentSetNumber(sets);
                                setExercisePhase('rpe');
                            }}
                            className="btn btn-secondary"
                            style={{
                                width: '100%',
                                marginTop: 'var(--spacing-sm)',
                                fontSize: '0.95rem'
                            }}
                            disabled={!weight}
                        >
                            <CheckCheck size={20} />
                            Completar todas directamente
                        </button>
                    </div>
                )}

                {exercisePhase === 'executing' && (
                    <div className="card" style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>
                            Descanso entre series
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                            Siguiente: Serie {currentSetNumber + 1}
                        </p>

                        {/* Quick rest buttons */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: 'var(--spacing-sm)',
                            marginBottom: 'var(--spacing-lg)'
                        }}>
                            {[
                                { label: '30s', seconds: 30 },
                                { label: '1 min', seconds: 60 },
                                { label: '90s', seconds: 90 },
                                { label: '2 min', seconds: 120 }
                            ].map(opt => (
                                <button
                                    key={opt.seconds}
                                    onClick={() => startRestTimer(opt.seconds)}
                                    className="btn btn-primary"
                                    style={{
                                        padding: 'var(--spacing-md) var(--spacing-sm)',
                                        fontSize: '0.95rem',
                                        fontWeight: 700
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {/* Skip rest – go directly to next set */}
                        <button
                            onClick={() => {
                                setCurrentSetNumber(prev => prev + 1);
                                setExercisePhase('doing');
                            }}
                            className="btn btn-secondary"
                            style={{ width: '100%', marginBottom: 'var(--spacing-lg)', opacity: 0.8 }}
                        >
                            Saltar descanso →
                        </button>

                        {/* Next set weight & reps – tap to edit */}
                        <div
                            onClick={() => openSetEditor(currentSetNumber + 1)}
                            style={{
                                cursor: 'pointer',
                                marginBottom: 'var(--spacing-xs)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <span style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {setWeights[currentSetNumber + 1] || setWeights[currentSetNumber] || weight} kg
                            </span>
                            <Pencil size={16} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
                        </div>
                        <div
                            onClick={() => openSetEditor(currentSetNumber + 1)}
                            style={{
                                cursor: 'pointer',
                                marginBottom: 'var(--spacing-lg)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
                                {setRepsMap[currentSetNumber + 1] || setRepsMap[currentSetNumber] || currentExercise.reps} reps
                            </span>
                            <Pencil size={14} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
                        </div>

                        {/* Progress indicator – clickable balls */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)', flexWrap: 'wrap' }}>
                            {Array.from({ length: totalSets }).map((_, i) => {
                                const setNum = i + 1;
                                const isDone = i < currentSetNumber;
                                const w = setWeights[setNum] || weight;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => !isDone && openSetEditor(setNum)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '2px',
                                            cursor: isDone ? 'default' : 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: isDone ? 'var(--success)' : 'var(--bg-input)',
                                            border: isDone ? 'none' : '2px solid var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 600,
                                            color: isDone ? 'white' : 'var(--text-muted)',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {isDone ? '✓' : setNum}
                                        </div>
                                        {!isDone && (
                                            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                                                {w}kg
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleCompleteAllSets}
                            className="btn btn-primary"
                            style={{ width: '100%', fontSize: '1rem' }}
                        >
                            <CheckCheck size={20} />
                            Completar todas las series
                        </button>
                    </div>
                )}

                {exercisePhase === 'doing' && (
                    <div className="card" style={{ marginBottom: 'var(--spacing-xl)', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>
                            💪 ¡Haz tu serie!
                        </h3>
                        <p style={{
                            fontSize: '1.125rem',
                            color: 'var(--text-secondary)',
                            marginBottom: 'var(--spacing-sm)'
                        }}>
                            Serie {currentSetNumber} / {totalSets}
                        </p>

                        {/* Quick rest: mark set done + start timer */}
                        {currentSetNumber < totalSets && (
                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 'var(--spacing-sm)'
                                }}>
                                    {[
                                        { label: '30s', seconds: 30 },
                                        { label: '1 min', seconds: 60 },
                                        { label: '90s', seconds: 90 },
                                        { label: '2 min', seconds: 120 }
                                    ].map(opt => (
                                        <button
                                            key={opt.seconds}
                                            onClick={() => handleSetDoneWithRest(opt.seconds)}
                                            className="btn btn-primary"
                                            style={{
                                                padding: '6px 4px',
                                                fontSize: '0.8rem',
                                                fontWeight: 700
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Current set weight & reps – tap to edit */}
                        <div
                            onClick={() => openSetEditor(currentSetNumber)}
                            style={{
                                cursor: 'pointer',
                                marginBottom: 'var(--spacing-xs)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                                {setWeights[currentSetNumber] || weight} kg
                            </span>
                            <Pencil size={18} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
                        </div>
                        <div
                            onClick={() => openSetEditor(currentSetNumber)}
                            style={{
                                cursor: 'pointer',
                                marginBottom: 'var(--spacing-lg)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-md)'
                            }}
                        >
                            <span style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
                                {setRepsMap[currentSetNumber] || currentExercise.reps} reps
                            </span>
                            <Pencil size={14} style={{ color: 'var(--text-muted)', opacity: 0.7 }} />
                        </div>

                        {/* Progress indicator – clickable balls */}
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                            Pulsa una serie para editarla
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xl)', flexWrap: 'wrap' }}>
                            {Array.from({ length: totalSets }).map((_, i) => {
                                const setNum = i + 1;
                                const isDone = i < currentSetNumber - 1;
                                const isCurrent = i === currentSetNumber - 1;
                                const w = setWeights[setNum] || weight;
                                return (
                                    <div
                                        key={i}
                                        onClick={() => openSetEditor(setNum)}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '2px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--bg-input)',
                                            border: !isDone && !isCurrent ? '2px solid var(--border)' : 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 600,
                                            color: isDone || isCurrent ? 'white' : 'var(--text-muted)',
                                            transition: 'all 0.2s ease'
                                        }}>
                                            {isDone ? '✓' : setNum}
                                        </div>
                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', lineHeight: 1 }}>
                                            {w}kg
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            onClick={handleSetDone}
                            className="btn btn-success"
                            style={{ width: '100%', fontSize: '1rem' }}
                        >
                            <Check size={20} />
                            Serie hecha
                        </button>


                        {currentSetNumber < totalSets && (
                            <button
                                onClick={handleCompleteAllSets}
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    marginTop: 'var(--spacing-sm)',
                                    fontSize: '1rem',
                                    opacity: 0.9
                                }}
                            >
                                <CheckCheck size={20} />
                                Completar todas las series
                            </button>
                        )}
                    </div>
                )}

                {exercisePhase === 'rpe' && (
                    <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                            ¡Ejercicio completado!
                        </h3>
                        {(() => {
                            const weights = Object.values(setWeights);
                            const reps = Object.values(setRepsMap);
                            const allSameWeight = weights.every(w => w === weights[0]);
                            const allSameReps = reps.every(r => r === reps[0]);

                            if (allSameWeight && allSameReps) {
                                return (
                                    <p style={{ textAlign: 'center', fontSize: '1.25rem', marginBottom: 'var(--spacing-lg)', color: 'var(--text-secondary)' }}>
                                        {totalSets} series × {weights[0] || weight} kg × {reps[0] || '?'} reps
                                    </p>
                                );
                            }
                            return (
                                <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                                    {Object.entries(setWeights).map(([setNum, w]) => (
                                        <p key={setNum} style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '2px 0' }}>
                                            Serie {setNum}: <strong>{w} kg × {setRepsMap[setNum] || '?'} reps</strong>
                                        </p>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* RPE Selector */}
                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                                RPE
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--spacing-sm)' }}>
                                {[1, 2, 3, 4, 5].map(level => {
                                    const emojis = ['😊', '🙂', '😐', '😓', '😰'];
                                    const isSelected = rpe === level;

                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setRpe(level)}
                                            style={{
                                                padding: 'var(--spacing-md)',
                                                borderRadius: 'var(--radius-md)',
                                                border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: isSelected ? 'var(--primary)' : 'var(--bg-input)',
                                                color: isSelected ? 'white' : 'var(--text-primary)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-xs)',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <div style={{ fontSize: '1.5rem' }}>{emojis[level - 1]}</div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{level}</div>
                                        </button>
                                    );
                                })}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--spacing-sm)' }}>
                                1 = Muy fácil | 5 = Muy difícil
                            </p>
                        </div>

                        <button
                            onClick={submitExerciseRPE}
                            className="btn btn-success btn-lg"
                            style={{ width: '100%' }}
                            disabled={!rpe}
                        >
                            <Check size={24} />
                            Guardar y Continuar
                        </button>
                    </div>
                )}

                {/* Previous Sets */}
                {Object.keys(sessionSets).filter(key => key.startsWith(`${currentExercise.id}-`)).length > 0 && (
                    <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Series completadas</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            {Object.entries(sessionSets)
                                .filter(([key]) => key.startsWith(`${currentExercise.id}-`))
                                .map(([key, set]) => {
                                    const setNum = key.split('-')[1];
                                    const rpeEmojis = ['😊', '🙂', '😐', '😓', '😰'];
                                    return (
                                        <div
                                            key={key}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: 'var(--spacing-sm)',
                                                background: 'var(--bg-input)',
                                                borderRadius: 'var(--radius-md)'
                                            }}
                                        >
                                            <span>Serie {setNum}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                                <span style={{ fontWeight: 600 }}>
                                                    {set.weight} kg × {set.reps} reps
                                                </span>
                                                {set.rpe && (
                                                    <span style={{ fontSize: '1.25rem' }}>
                                                        {rpeEmojis[set.rpe - 1]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}

                {/* Navigation & Actions */}
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                    <button
                        onClick={handlePreviousExercise}
                        className="btn btn-secondary"
                        disabled={currentExerciseIndex === 0}
                        style={{ flex: 1 }}
                    >
                        <ChevronLeft size={20} />
                        Anterior
                    </button>

                    <button
                        onClick={() => setShowNotes(true)}
                        className="btn btn-secondary btn-icon"
                    >
                        <StickyNote size={20} />
                    </button>

                    <button
                        onClick={handleNextExercise}
                        className="btn btn-secondary"
                        disabled={currentExerciseIndex === exercises.length - 1}
                        style={{ flex: 1 }}
                    >
                        Siguiente
                        <ChevronRight size={20} />
                    </button>
                </div>

                <button
                    onClick={handleSkipSet}
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                >
                    Saltar Serie
                </button>

                <button
                    onClick={handleSkipExercise}
                    className="btn btn-secondary"
                    style={{ width: '100%', marginTop: 'var(--spacing-sm)', opacity: 0.7 }}
                >
                    Saltar Ejercicio
                </button>
            </div>

            {/* Rest Timer */}
            {showTimer && (
                <RestTimer
                    duration={timerDuration}
                    onComplete={handleRestTimerComplete}
                    onSkip={handleRestTimerComplete}
                />
            )}

            {/* Prep Timer */}
            {showPrepTimer && (
                <PrepTimer
                    setNumber={currentSetNumber}
                    totalSets={totalSets}
                    onComplete={handlePrepTimerComplete}
                    onSkip={handlePrepTimerComplete}
                />
            )}

            {/* Notes Modal */}
            {showNotes && (
                <NotesModal
                    exercise={currentExercise}
                    onClose={() => setShowNotes(false)}
                />
            )}

            {/* Session Complete Modal */}
            <AppModal
                isOpen={showCompleteModal}
                onClose={onClose}
                type="success"
                title="¡Sesión completada! 💪"
                message={`Has terminado ${workout.name} en ${sessionDuration} minutos.\n\n¡Gran trabajo, guerrero!`}
                confirmText="Cerrar"
                onConfirm={onClose}
                hideCancel
            />

            {/* Set Editor Modal */}
            {editingSetNumber !== null && (
                <div
                    onClick={() => setEditingSetNumber(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        zIndex: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--spacing-md)'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: 'var(--radius-xl)',
                            padding: 'var(--spacing-xl)',
                            width: '100%',
                            maxWidth: '340px',
                            border: '1px solid var(--border)'
                        }}
                    >
                        <h3 style={{ textAlign: 'center', marginBottom: 'var(--spacing-lg)' }}>
                            Editar Serie {editingSetNumber}
                        </h3>

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Peso (kg)
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={editSetWeight}
                                onChange={(e) => setEditSetWeight(e.target.value)}
                                step="0.5"
                                autoFocus
                                style={{ fontSize: '1.25rem', textAlign: 'center', width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                Repeticiones
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={editSetReps}
                                onChange={(e) => setEditSetReps(e.target.value)}
                                min="0"
                                step="1"
                                style={{ fontSize: '1.25rem', textAlign: 'center', width: '100%' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                            <button
                                onClick={() => applySetEdit('single')}
                                className="btn btn-secondary"
                                style={{ width: '100%' }}
                            >
                                Solo serie {editingSetNumber}
                            </button>
                            <button
                                onClick={() => applySetEdit('remaining')}
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                            >
                                Serie {editingSetNumber} y restantes
                            </button>
                            <button
                                onClick={() => setEditingSetNumber(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-muted)',
                                    cursor: 'pointer',
                                    padding: 'var(--spacing-sm)',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
