// Workout data – Rutinas personalizadas
export const workoutData = [
    {
        name: 'Día 1 – Pecho + Espalda',
        day: 'Pecho/Espalda',
        order: 1,
        duration: '70-80 min',
        exercises: [
            // Bloque 1 (fuerza)
            {
                name: 'Press banca con barra',
                sets: '4x6-8',
                reps: '6-8',
                rir: '',
                rest: '90-120s',
                order: 1,
                block: 'Bloque 1 – Fuerza',
                exerciseDbId: '0027',
                gifUrl: '',
                notes: ''
            },
            {
                name: 'Jalón cerrado neutro con inclinación',
                sets: '4x6-8',
                reps: '6-8',
                rir: '',
                rest: '90-120s',
                order: 2,
                block: 'Bloque 1 – Fuerza',
                exerciseDbId: '0197',
                gifUrl: '',
                notes: ''
            },
            // Bloque 2 (volumen medio)
            {
                name: 'Press inclinado con barra',
                sets: '3x8-10',
                reps: '8-10',
                rir: '',
                rest: '75-90s',
                order: 3,
                block: 'Bloque 2 – Volumen medio',
                exerciseDbId: '0314',
                gifUrl: '',
                notes: ''
            },
            {
                name: 'Remo aislado con mancuerna',
                sets: '3x8-10',
                reps: '8-10',
                rir: '',
                rest: '75-90s',
                order: 4,
                block: 'Bloque 2 – Volumen medio',
                exerciseDbId: '0207',
                gifUrl: '',
                notes: 'Por lado'
            },
            // Bloque 3 (bombeo)
            {
                name: 'Press en máquina',
                sets: '3x10-12',
                reps: '10-12',
                rir: '',
                rest: '60-75s',
                order: 5,
                block: 'Bloque 3 – Bombeo',
                exerciseDbId: '0027',
                gifUrl: '',
                notes: ''
            },
            {
                name: 'Remo horizontal en máquina',
                sets: '3x10-12',
                reps: '10-12',
                rir: '',
                rest: '60-75s',
                order: 6,
                block: 'Bloque 3 – Bombeo',
                exerciseDbId: '0207',
                gifUrl: '',
                notes: ''
            }
        ]
    },
    {
        name: 'Día 2 – Hombro + Bíceps + Tríceps',
        day: 'Hombro/Bíceps/Tríceps',
        order: 2,
        duration: '70-75 min',
        exercises: [
            // Bloque 1 (principal – estabilidad + fuerza)
            {
                name: 'Press militar neutro en máquina',
                sets: '4x8-10',
                reps: '8-10',
                rir: '',
                rest: '90s',
                order: 1,
                block: 'Bloque 1 – Estabilidad + Fuerza',
                exerciseDbId: '0134',
                gifUrl: '',
                notes: 'Prioridad agarres neutros y control total'
            },
            {
                name: 'Curl martillo con barra',
                sets: '3-4x8-10',
                reps: '8-10',
                rir: '',
                rest: '90s',
                order: 2,
                block: 'Bloque 1 – Estabilidad + Fuerza',
                exerciseDbId: '0298',
                gifUrl: '',
                notes: ''
            },
            // Bloque 2 (volumen medio)
            {
                name: 'Remo superior mancuerna',
                sets: '3x10-12',
                reps: '10-12',
                rir: '',
                rest: '75-90s',
                order: 3,
                block: 'Bloque 2 – Volumen medio',
                exerciseDbId: '0338',
                gifUrl: '',
                notes: 'Trabajo deltoide medio/posterior'
            },
            {
                name: 'Curl supinación cerrado barra Z',
                sets: '3x8-10',
                reps: '8-10',
                rir: '',
                rest: '75-90s',
                order: 4,
                block: 'Bloque 2 – Volumen medio',
                exerciseDbId: '0168',
                gifUrl: '',
                notes: ''
            },
            {
                name: 'Extensión vertical neutra en polea',
                sets: '3-4x8-10',
                reps: '8-10',
                rir: '',
                rest: '75-90s',
                order: 5,
                block: 'Bloque 2 – Volumen medio',
                exerciseDbId: '1451',
                gifUrl: '',
                notes: ''
            },
            // Bloque 3 (bombeo / control)
            {
                name: 'Pájaros sentado mancuernas',
                sets: '3x12-15',
                reps: '12-15',
                rir: '',
                rest: '60-75s',
                order: 6,
                block: 'Bloque 3 – Bombeo / Control',
                exerciseDbId: '0187',
                gifUrl: '',
                notes: 'Mucho control, sin balanceos, protegiendo el hombro'
            },
            {
                name: 'Curl concentrado mancuerna',
                sets: '3x10-12',
                reps: '10-12',
                rir: '',
                rest: '60-75s',
                order: 7,
                block: 'Bloque 3 – Bombeo / Control',
                exerciseDbId: '0298',
                gifUrl: '',
                notes: 'Por brazo'
            },
            {
                name: 'Patadas traseras mancuerna',
                sets: '3x12-15',
                reps: '12-15',
                rir: '',
                rest: '60-75s',
                order: 8,
                block: 'Bloque 3 – Bombeo / Control',
                exerciseDbId: '1452',
                gifUrl: '',
                notes: ''
            }
        ]
    },
    {
        name: 'Día 3 – Full Body Controlado',
        day: 'Full Body',
        order: 3,
        duration: '60 min',
        exercises: [
            {
                name: 'Press máquina',
                sets: '3x8-10',
                reps: '8-10',
                rir: '',
                rest: '60-75s',
                order: 1,
                block: '',
                exerciseDbId: '0027',
                gifUrl: '',
                notes: 'Día metabólico, menos pesado'
            },
            {
                name: 'Jalón neutro',
                sets: '3x8-10',
                reps: '8-10',
                rir: '',
                rest: '60-75s',
                order: 2,
                block: '',
                exerciseDbId: '0197',
                gifUrl: '',
                notes: ''
            },
            {
                name: 'Remo máquina',
                sets: '3x10',
                reps: '10',
                rir: '',
                rest: '60-75s',
                order: 3,
                block: '',
                exerciseDbId: '0207',
                gifUrl: '',
                notes: ''
            },
            {
                name: 'Press neutro hombro',
                sets: '3x10',
                reps: '10',
                rir: '',
                rest: '60-75s',
                order: 4,
                block: '',
                exerciseDbId: '0134',
                gifUrl: '',
                notes: ''
            },
            {
                name: 'Curl martillo',
                sets: '3x10',
                reps: '10',
                rir: '',
                rest: '60-75s',
                order: 5,
                block: '',
                exerciseDbId: '0298',
                gifUrl: '',
                notes: ''
            },
            {
                name: 'Extensión polea',
                sets: '3x10',
                reps: '10',
                rir: '',
                rest: '60-75s',
                order: 6,
                block: '',
                exerciseDbId: '1451',
                gifUrl: '',
                notes: ''
            }
        ]
    },
    {
        name: 'Día 4 – Cardio + Core',
        day: 'Cardio/Core',
        order: 4,
        duration: '40-50 min',
        exercises: [
            {
                name: 'Elíptica',
                sets: '1x25-30min',
                reps: '25-30 min',
                rir: '',
                rest: '',
                order: 1,
                block: 'Cardio',
                exerciseDbId: 'cardio-01',
                gifUrl: '',
                notes: 'Intervalos moderados'
            },
            {
                name: 'Plancha frontal',
                sets: '3x30-40s',
                reps: '30-40s',
                rir: '',
                rest: '60s',
                order: 2,
                block: 'Core',
                exerciseDbId: 'core-01',
                gifUrl: '',
                notes: ''
            },
            {
                name: 'Plancha lateral',
                sets: '3x30s',
                reps: '30s',
                rir: '',
                rest: '60s',
                order: 3,
                block: 'Core',
                exerciseDbId: 'core-02',
                gifUrl: '',
                notes: 'Por lado'
            },
            {
                name: 'Crunch controlado',
                sets: '3x15',
                reps: '15',
                rir: '',
                rest: '60s',
                order: 4,
                block: 'Core',
                exerciseDbId: 'core-03',
                gifUrl: '',
                notes: ''
            },
            {
                name: 'Elevaciones de rodillas',
                sets: '3x12',
                reps: '12',
                rir: '',
                rest: '60s',
                order: 5,
                block: 'Core',
                exerciseDbId: 'core-04',
                gifUrl: '',
                notes: ''
            }
        ]
    }
];
