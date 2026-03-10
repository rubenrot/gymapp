import Dexie from 'dexie';

export const db = new Dexie('GorilAppDB');

db.version(3).stores({
  workouts: '++id, name, day, order',
  exercises: '++id, workoutId, name, sets, reps, rir, rest, order, exerciseDbId, gifUrl',
  sessions: '++id, workoutId, date, duration, notes',
  sets: '++id, sessionId, exerciseId, setNumber, weight, reps, rir, rpe, date',
  notes: '++id, exerciseId, note, date'
});

// Additive migration: keeps existing data and adds body weight tracking.
db.version(4).stores({
  workouts: '++id, name, day, order',
  exercises: '++id, workoutId, name, sets, reps, rir, rest, order, exerciseDbId, gifUrl',
  sessions: '++id, workoutId, date, duration, notes',
  sets: '++id, sessionId, exerciseId, setNumber, weight, reps, rir, rpe, date',
  notes: '++id, exerciseId, note, date',
  bodyMetrics: '++id, date'
});

function toMetricDate(inputDate) {
  if (!inputDate) return new Date().toISOString().slice(0, 10);
  if (typeof inputDate === 'string') return inputDate.slice(0, 10);
  return new Date(inputDate).toISOString().slice(0, 10);
}

function normalizeMetric(metric) {
  return {
    ...metric,
    date: toMetricDate(metric.date),
    notes: metric.notes || metric.optionalNotes || ''
  };
}

// Initialize database with workout data
// Bump this version every time workoutData.js changes.
const WORKOUT_DATA_VERSION = 4;
const WD_VERSION_KEY = 'workoutDataVersion';
const EXPECTED_WORKOUT_COUNT = 4; // number of routines in workoutData.js

let _initPromise = null;

export function initializeDatabase() {
  // Singleton: always return the same promise so double-calls (React StrictMode) are harmless
  if (!_initPromise) {
    _initPromise = _doInit();
  }
  return _initPromise;
}

async function _doInit() {
  const savedVersion = Number(localStorage.getItem(WD_VERSION_KEY) || 0);
  const count = await db.workouts.count();

  // Re-seed when: first run, version bump, OR duplicate/corrupt data detected
  if (count === 0 || savedVersion < WORKOUT_DATA_VERSION || count !== EXPECTED_WORKOUT_COUNT) {
    localStorage.setItem(WD_VERSION_KEY, String(WORKOUT_DATA_VERSION));
    await _clearAndSeed();
    console.log(`Database (re)initialized with workout data v${WORKOUT_DATA_VERSION}`);
  }
}

async function _clearAndSeed() {
  const { workoutData } = await import('../data/workoutData');

  await db.transaction('rw', db.workouts, db.exercises, async () => {
    await db.exercises.clear();
    await db.workouts.clear();

    for (const workout of workoutData) {
      const workoutId = await db.workouts.add({
        name: workout.name,
        day: workout.day,
        order: workout.order,
        duration: workout.duration || ''
      });

      for (const exercise of workout.exercises) {
        await db.exercises.add({
          workoutId,
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          rir: exercise.rir,
          rest: exercise.rest,
          order: exercise.order,
          block: exercise.block || '',
          exerciseDbId: exercise.exerciseDbId,
          gifUrl: exercise.gifUrl || '',
          notes: exercise.notes || ''
        });
      }
    }
  });
}

// Reset workout/exercise templates without losing session data
export async function resetWorkoutTemplates() {
  await _clearAndSeed();
  localStorage.setItem(WD_VERSION_KEY, String(WORKOUT_DATA_VERSION));
  console.log('Workout templates reset with new data');
}

// Helper functions
export async function getWorkouts() {
  return await db.workouts.orderBy('order').toArray();
}

export async function getWorkoutById(id) {
  return await db.workouts.get(id);
}

export async function getExercisesByWorkout(workoutId) {
  return await db.exercises.where('workoutId').equals(workoutId).sortBy('order');
}

export async function getExerciseById(id) {
  return await db.exercises.get(id);
}

export async function addExercise(exerciseData) {
  // Get max order for this workout to append at the end
  const lastExercise = await db.exercises
    .where('workoutId')
    .equals(exerciseData.workoutId)
    .reverse()
    .sortBy('order');

  const order = lastExercise.length > 0 ? lastExercise[0].order + 1 : 0;

  return await db.exercises.add({
    ...exerciseData,
    order,
    gifUrl: exerciseData.gifUrl || '',
    notes: exerciseData.notes || '',
    exerciseDbId: exerciseData.exerciseDbId || 'custom'
  });
}

export async function updateExercise(id, updates) {
  return await db.exercises.update(id, updates);
}

export async function deleteExercise(id) {
  return await db.exercises.delete(id);
}

export async function createSession(workoutId, notes = '') {
  return await db.sessions.add({
    workoutId,
    date: new Date().toISOString(),
    duration: 0,
    notes
  });
}

export async function updateSession(sessionId, data) {
  return await db.sessions.update(sessionId, data);
}

export async function addSet(sessionId, exerciseId, setNumber, weight, reps, rir, rpe = null) {
  return await db.sets.add({
    sessionId,
    exerciseId,
    setNumber,
    weight,
    reps,
    rir,
    rpe,
    date: new Date().toISOString()
  });
}

export async function getSetsBySession(sessionId) {
  return await db.sets.where('sessionId').equals(sessionId).toArray();
}

export async function getSetsByExercise(exerciseId, limit = 10) {
  return await db.sets
    .where('exerciseId')
    .equals(exerciseId)
    .reverse()
    .limit(limit)
    .toArray();
}

export async function getSessions(limit = 20) {
  return await db.sessions.orderBy('date').reverse().limit(limit).toArray();
}

export async function getSessionsByWorkout(workoutId, limit = 10) {
  return await db.sessions
    .where('workoutId')
    .equals(workoutId)
    .reverse()
    .limit(limit)
    .toArray();
}

export async function addNote(exerciseId, note) {
  return await db.notes.add({
    exerciseId,
    note,
    date: new Date().toISOString()
  });
}

export async function getNotesByExercise(exerciseId) {
  return await db.notes
    .where('exerciseId')
    .equals(exerciseId)
    .reverse()
    .toArray();
}

export async function getProgressData(exerciseId, days = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const sets = await db.sets
    .where('exerciseId')
    .equals(exerciseId)
    .filter(set => new Date(set.date) >= cutoffDate)
    .toArray();

  // Group by date and calculate max weight
  const progressByDate = {};
  sets.forEach(set => {
    const date = new Date(set.date).toLocaleDateString();
    if (!progressByDate[date] || set.weight > progressByDate[date].weight) {
      progressByDate[date] = {
        date,
        weight: set.weight,
        reps: set.reps
      };
    }
  });

  return Object.values(progressByDate).sort((a, b) =>
    new Date(a.date) - new Date(b.date)
  );
}

export async function addBodyMetric({ date, weightKg, notes = '' }) {
  const numericWeight = Number(weightKg);
  if (!numericWeight || numericWeight <= 0) {
    throw new Error('Peso invalido');
  }

  return await db.bodyMetrics.add({
    date: toMetricDate(date),
    weightKg: numericWeight,
    notes: notes.trim()
  });
}

export async function updateBodyMetric(id, updates) {
  const payload = { ...updates };

  if (payload.date) {
    payload.date = toMetricDate(payload.date);
  }

  if (payload.weightKg !== undefined) {
    const numericWeight = Number(payload.weightKg);
    if (!numericWeight || numericWeight <= 0) {
      throw new Error('Peso invalido');
    }
    payload.weightKg = numericWeight;
  }

  if (payload.notes !== undefined) {
    payload.notes = (payload.notes || '').trim();
  }

  return await db.bodyMetrics.update(id, payload);
}

export async function getBodyMetrics(limit = 120) {
  const rows = await db.bodyMetrics
    .orderBy('date')
    .reverse()
    .limit(limit)
    .toArray();

  return rows.map(normalizeMetric);
}

export async function getLatestBodyMetric() {
  const latest = await db.bodyMetrics
    .orderBy('date')
    .reverse()
    .limit(1)
    .toArray();

  return latest.length > 0 ? normalizeMetric(latest[0]) : null;
}

export async function deleteBodyMetric(id) {
  return await db.bodyMetrics.delete(id);
}
