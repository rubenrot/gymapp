// Mapeo de nombres de ejercicios en español a IDs de free-exercise-db
export const exerciseImageMap = {
    // Día 1 – Pecho + Espalda
    'Press banca con barra': 'Barbell_Bench_Press',
    'Jalón cerrado neutro con inclinación': 'Wide_Grip_Lat_Pulldown',
    'Press inclinado con barra': 'Barbell_Incline_Bench_Press',
    'Remo aislado con mancuerna': 'One_Arm_Dumbbell_Row',
    'Press en máquina': 'Barbell_Bench_Press',
    'Remo horizontal en máquina': 'Barbell_Bent_Over_Row',

    // Día 2 – Hombro + Bíceps + Tríceps
    'Press militar neutro en máquina': 'Standing_Military_Press',
    'Curl martillo con barra': 'Hammer_Curls',
    'Remo superior mancuerna': 'Dumbbell_Lateral_Raise',
    'Curl supinación cerrado barra Z': 'Barbell_Curl',
    'Extensión vertical neutra en polea': 'Dumbbell_Tricep_Extension',
    'Pájaros sentado mancuernas': 'Face_Pull',
    'Curl concentrado mancuerna': 'Barbell_Curl',
    'Patadas traseras mancuerna': 'Dumbbell_Tricep_Extension',

    // Día 3 – Full Body Controlado
    'Press máquina': 'Barbell_Bench_Press',
    'Jalón neutro': 'Wide_Grip_Lat_Pulldown',
    'Remo máquina': 'Barbell_Bent_Over_Row',
    'Press neutro hombro': 'Standing_Military_Press',
    'Curl martillo': 'Hammer_Curls',
    'Extensión polea': 'Dumbbell_Tricep_Extension',

    // Día 4 – Cardio + Core
    'Elíptica': null,
    'Plancha frontal': null,
    'Plancha lateral': null,
    'Crunch controlado': null,
    'Elevaciones de rodillas': null
};

/**
 * Get exercise image URL from free-exercise-db GitHub repository
 * @param {string} exerciseName - Name of exercise in Spanish
 * @param {number} imageIndex - Image index (0 = start position, 1 = end position)
 * @returns {string|null} Image URL or null if not found
 */
export function getExerciseImageUrl(exerciseName, imageIndex = 0) {
    const exerciseId = exerciseImageMap[exerciseName];
    if (!exerciseId) return null;

    const baseUrl = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
    return `${baseUrl}/${exerciseId}/${imageIndex}.jpg`;
}

/**
 * Get both exercise images (start and end positions)
 * @param {string} exerciseName - Name of exercise in Spanish
 * @returns {Array<string>|null} Array of image URLs or null if not found
 */
export function getExerciseImages(exerciseName) {
    const exerciseId = exerciseImageMap[exerciseName];
    if (!exerciseId) return null;

    const baseUrl = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises';
    return [
        `${baseUrl}/${exerciseId}/0.jpg`,
        `${baseUrl}/${exerciseId}/1.jpg`
    ];
}
