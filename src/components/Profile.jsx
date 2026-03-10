import { useState, useEffect } from 'react';
import { Download, Upload, Trash2, Database, Ruler, RefreshCw } from 'lucide-react';
import { exportData, importData, clearAllData, getDatabaseStats } from '../db/backup';
import { resetWorkoutTemplates } from '../db/database';
import AppModal from './AppModal';

const HEIGHT_KEY = 'userHeightCm';

export default function Profile() {
    const [stats, setStats] = useState(null);
    const [message, setMessage] = useState('');
    const [heightCm, setHeightCm] = useState(() => localStorage.getItem(HEIGHT_KEY) || '');
    const [pendingImportFile, setPendingImportFile] = useState(null);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [showClearModal, setShowClearModal] = useState(false);
    const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

    const loadStats = async () => {
        const dbStats = await getDatabaseStats();
        setStats(dbStats);
    };

    useEffect(() => {
        const timerId = setTimeout(() => {
            loadStats();
        }, 0);

        return () => clearTimeout(timerId);
    }, []);

    function handleSaveHeight() {
        const numericHeight = Number(heightCm);
        if (!numericHeight || numericHeight < 120 || numericHeight > 230) {
            setMessage('La altura debe estar entre 120 y 230 cm.');
            setTimeout(() => setMessage(''), 3000);
            return;
        }

        localStorage.setItem(HEIGHT_KEY, String(numericHeight));
        setHeightCm(String(numericHeight));
        setMessage('Altura guardada correctamente.');
        setTimeout(() => setMessage(''), 3000);
    }

    async function handleExport() {
        const result = await exportData();
        setMessage(result.message);
        setTimeout(() => setMessage(''), 3000);
    }

    async function handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        setPendingImportFile(file);
        setShowImportModal(true);
        // Reset file input
        event.target.value = '';
    }

    async function doImport(replace) {
        setShowImportModal(false);
        if (!pendingImportFile) return;

        const result = await importData(pendingImportFile, replace);
        setMessage(result.message);
        setTimeout(() => setMessage(''), 3000);
        setPendingImportFile(null);

        if (result.success) {
            loadStats();
        }
    }

    async function handleResetWorkouts() {
        setShowResetModal(true);
    }

    async function doResetWorkouts() {
        setShowResetModal(false);
        try {
            await resetWorkoutTemplates();
            setMessage('✅ Rutinas actualizadas correctamente. Recarga la app.');
            setTimeout(() => setMessage(''), 5000);
            loadStats();
        } catch (error) {
            console.error(error);
            setMessage('Error al recargar rutinas.');
            setTimeout(() => setMessage(''), 3000);
        }
    }

    async function handleClearData() {
        setShowClearModal(true);
    }

    function handleClearFirstConfirm() {
        setShowClearModal(false);
        setShowClearConfirmModal(true);
    }

    async function doClearData() {
        setShowClearConfirmModal(false);
        const result = await clearAllData();
        setMessage(result.message);
        setTimeout(() => setMessage(''), 3000);

        if (result.success) {
            loadStats();
        }
    }

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Perfil</h2>

            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <img
                    src={`${import.meta.env.BASE_URL}logo.png`}
                    alt="Valhalla Logo"
                    style={{
                        height: '120px',
                        width: '120px',
                        objectFit: 'contain',
                        margin: '0 auto var(--spacing-md)'
                    }}
                />
                <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Valhalla</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                    Tu gymbro de entrenamiento
                </p>

                <div style={{
                    background: 'var(--bg-input)',
                    padding: 'var(--spacing-lg)',
                    borderRadius: 'var(--radius-lg)',
                    textAlign: 'left'
                }}>
                    <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Características v1.2.1</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        <li style={{ padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--border)' }}>
                            ✅ <strong>Gestión Total (CRUD)</strong>: Crea y edita ejercicios
                        </li>
                        <li style={{ padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--border)' }}>
                            ✅ <strong>Timers Pro</strong>: Tabata, EMOM, AMRAP, Clock
                        </li>
                        <li style={{ padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--border)' }}>
                            ✅ <strong>Modo LED</strong>: Estética 7-segmentos
                        </li>
                        <li style={{ padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--border)' }}>
                            ✅ <strong>Registro Completo</strong>: Series, Reps, RIR, Notas
                        </li>
                        <li style={{ padding: 'var(--spacing-sm) 0', borderBottom: '1px solid var(--border)' }}>
                            ✅ <strong>100% Privado</strong>: Datos locales (DexieDB)
                        </li>
                        <li style={{ padding: 'var(--spacing-sm) 0' }}>
                            ✅ <strong>PWA Offline</strong>: Entrena sin internet
                        </li>
                    </ul>
                </div>

                <p style={{ marginTop: 'var(--spacing-xl)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Versión 1.2.1 - Desarrollado por Jimmy80
                </p>
            </div>

            {/* Database Statistics */}
            {stats && (
                <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Database size={20} />
                        Estadísticas de la Base de Datos
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                        <div style={{ background: 'var(--bg-input)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.sessions}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Sesiones</div>
                        </div>
                        <div style={{ background: 'var(--bg-input)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.sets}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Series</div>
                        </div>
                        <div style={{ background: 'var(--bg-input)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.exercises}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Ejercicios</div>
                        </div>
                        <div style={{ background: 'var(--bg-input)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.notes}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Notas</div>
                        </div>
                        <div style={{ background: 'var(--bg-input)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-md)', textAlign: 'center', gridColumn: '1 / -1' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{stats.bodyMetrics}</div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Registros de peso</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Height setting for BMI calculations */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h4 style={{ marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Ruler size={20} />
                    Altura para IMC
                </h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-md)' }}>
                    Se usa para calcular IMC en Progreso (peso corporal).
                </p>
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <input
                        type="number"
                        className="input"
                        min="120"
                        max="230"
                        step="1"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        placeholder="Ej: 178"
                    />
                    <button onClick={handleSaveHeight} className="btn btn-primary">
                        Guardar
                    </button>
                </div>
            </div>

            {/* Backup & Restore */}
            <div className="card" style={{ marginTop: 'var(--spacing-lg)' }}>
                <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Backup y Restauración</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 'var(--spacing-lg)' }}>
                    Exporta tus datos para hacer backup o importa datos desde otro dispositivo
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                    >
                        <Download size={20} />
                        Exportar Datos (Backup)
                    </button>

                    {/* Import Button */}
                    <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer', margin: 0 }}>
                        <Upload size={20} />
                        Importar Datos
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                    </label>

                    {/* Reset Workout Templates */}
                    <button
                        onClick={handleResetWorkouts}
                        className="btn"
                        style={{
                            width: '100%',
                            background: 'var(--accent-deep, #078d7a)',
                            color: 'var(--text-main, white)'
                        }}
                    >
                        <RefreshCw size={20} />
                        Recargar Rutinas
                    </button>

                    {/* Clear Data Button */}
                    <button
                        onClick={handleClearData}
                        className="btn"
                        style={{
                            width: '100%',
                            background: 'var(--error)',
                            color: 'white'
                        }}
                    >
                        <Trash2 size={20} />
                        Borrar Todos los Datos
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div style={{
                        marginTop: 'var(--spacing-md)',
                        padding: 'var(--spacing-md)',
                        background: message.includes('Error') ? 'var(--error)' : 'var(--success)',
                        color: 'white',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        {message}
                    </div>
                )}
            </div>

            {/* Import Mode Modal */}
            <AppModal
                isOpen={showImportModal}
                onClose={() => { setShowImportModal(false); setPendingImportFile(null); }}
                type="confirm"
                title="Importar datos"
                message={'¿Quieres reemplazar todos los datos existentes?\n\n"Reemplazar" = Borra todo y carga el backup\n"Añadir" = Añade el backup a los datos actuales'}
                confirmText="Reemplazar"
                cancelText="Añadir"
                onConfirm={() => doImport(true)}
                onCancel={() => doImport(false)}
            />

            {/* Reset Workouts Modal */}
            <AppModal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                type="warning"
                title="Recargar rutinas"
                message={'Esto recargará las rutinas y ejercicios predefinidos.\n\nTu historial de sesiones y series NO se borrará.\n\n¿Continuar?'}
                confirmText="Recargar"
                onConfirm={doResetWorkouts}
                onCancel={() => setShowResetModal(false)}
            />

            {/* Clear Data Modal – Step 1 */}
            <AppModal
                isOpen={showClearModal}
                onClose={() => setShowClearModal(false)}
                type="danger"
                title="⚠️ Borrar todos los datos"
                message={'Esto eliminará TODOS tus datos:\n• Historial de entrenamientos\n• Series registradas\n• Notas\n\n¿Estás seguro?\n\nRecomendación: Exporta un backup antes de continuar.'}
                confirmText="Sí, continuar"
                onConfirm={handleClearFirstConfirm}
                onCancel={() => setShowClearModal(false)}
            />

            {/* Clear Data Modal – Step 2 (double confirm) */}
            <AppModal
                isOpen={showClearConfirmModal}
                onClose={() => setShowClearConfirmModal(false)}
                type="danger"
                title="Confirmación final"
                message="¿Estás COMPLETAMENTE seguro? Esta acción no se puede deshacer."
                confirmText="Eliminar todo"
                onConfirm={doClearData}
                onCancel={() => setShowClearConfirmModal(false)}
            />
        </div>
    );
}
