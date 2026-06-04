import { useState, useEffect, useMemo } from 'react';
import { X, Save, Search, ImageOff } from 'lucide-react';
import exercisesData from '../data/exercises.json';

export default function ExerciseModal({ isOpen, onClose, onSave, initialData }) {
    const [formData, setFormData] = useState({
        name: '',
        sets: '3',
        reps: '8-12',
        rir: '2',
        rest: '90s',
        block: '',
        notes: '',
        gifUrl: ''
    });

    const [gifSearch, setGifSearch] = useState('');
    const [showGifResults, setShowGifResults] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                sets: initialData.sets || '3',
                reps: initialData.reps || '8-12',
                rir: initialData.rir || '2',
                rest: initialData.rest || '90s',
                block: initialData.block || '',
                notes: initialData.notes || '',
                gifUrl: initialData.gifUrl || ''
            });
            setGifSearch(initialData.name || '');
        } else {
            setFormData({ name: '', sets: '3', reps: '8-12', rir: '2', rest: '90s', block: '', notes: '', gifUrl: '' });
            setGifSearch('');
        }
        setShowGifResults(false);
    }, [initialData, isOpen]);

    const gifResults = useMemo(() => {
        const q = gifSearch.trim().toLowerCase();
        if (!q || q.length < 2) return [];
        return exercisesData
            .filter(ex => ex.gifUrl && ex.name.toLowerCase().includes(q))
            .slice(0, 12);
    }, [gifSearch]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const selectGif = (ex) => {
        setFormData(prev => ({ ...prev, gifUrl: ex.gifUrl }));
        setGifSearch(ex.name);
        setShowGifResults(false);
    };

    const clearGif = () => {
        setFormData(prev => ({ ...prev, gifUrl: '' }));
        setGifSearch('');
        setShowGifResults(false);
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content animate-slideUp"
                onClick={e => e.stopPropagation()}
                style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
            >
                <div className="modal-header">
                    <h3 style={{ margin: 0, color: 'white' }}>
                        {initialData ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
                    </h3>
                    <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 'var(--spacing-lg)' }}>
                    {/* Nombre */}
                    <div className="form-group">
                        <label>Nombre del Ejercicio</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="input"
                            placeholder="Ej: Press de Banca"
                            required
                            autoFocus
                        />
                    </div>

                    {/* Series / Reps */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div className="form-group">
                            <label>Series</label>
                            <input type="text" name="sets" value={formData.sets} onChange={handleChange} className="input" placeholder="4" required />
                        </div>
                        <div className="form-group">
                            <label>Reps</label>
                            <input type="text" name="reps" value={formData.reps} onChange={handleChange} className="input" placeholder="8-12" required />
                        </div>
                    </div>

                    {/* RIR / Descanso */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                        <div className="form-group">
                            <label>RIR Target</label>
                            <input type="text" name="rir" value={formData.rir} onChange={handleChange} className="input" placeholder="1-2" />
                        </div>
                        <div className="form-group">
                            <label>Descanso</label>
                            <input type="text" name="rest" value={formData.rest} onChange={handleChange} className="input" placeholder="90s" />
                        </div>
                    </div>

                    {/* Bloque */}
                    <div className="form-group">
                        <label>Bloque (Opcional)</label>
                        <input type="text" name="block" value={formData.block} onChange={handleChange} className="input" placeholder="Ej: Bloque 1 – Fuerza" />
                    </div>

                    {/* Notas */}
                    <div className="form-group">
                        <label>Notas (Opcional)</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} className="input" placeholder="Tips técnicos, setup, etc." rows={2} style={{ resize: 'vertical' }} />
                    </div>

                    {/* ── GIF Search ── */}
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Search size={14} /> GIF del ejercicio
                        </label>

                        {/* Preview */}
                        {formData.gifUrl && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-md)',
                                marginBottom: 'var(--spacing-sm)',
                                padding: 'var(--spacing-sm)',
                                background: 'var(--bg-input)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border)'
                            }}>
                                <img
                                    src={formData.gifUrl}
                                    alt="preview"
                                    style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 6, background: '#fff', flexShrink: 0 }}
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', wordBreak: 'break-all', lineClamp: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {formData.gifUrl}
                                    </p>
                                </div>
                                <button type="button" onClick={clearGif} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}>
                                    <X size={16} />
                                </button>
                            </div>
                        )}

                        {/* Search input */}
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <input
                                type="text"
                                value={gifSearch}
                                onChange={e => { setGifSearch(e.target.value); setShowGifResults(true); }}
                                onFocus={() => setShowGifResults(true)}
                                className="input"
                                placeholder="Buscar ejercicio para asignar GIF…"
                                style={{ paddingLeft: 34 }}
                            />
                        </div>

                        {/* Results grid */}
                        {showGifResults && gifResults.length > 0 && (
                            <div style={{
                                marginTop: 6,
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-md)',
                                maxHeight: 260,
                                overflowY: 'auto',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 6,
                                padding: 8
                            }}>
                                {gifResults.map((ex, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => selectGif(ex)}
                                        style={{
                                            background: formData.gifUrl === ex.gifUrl ? 'rgba(12,230,199,0.15)' : 'var(--bg-input)',
                                            border: formData.gifUrl === ex.gifUrl ? '1px solid var(--accent)' : '1px solid var(--border)',
                                            borderRadius: 8,
                                            padding: 6,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: 4,
                                            transition: 'all 0.15s'
                                        }}
                                    >
                                        <img
                                            src={ex.gifUrl}
                                            alt={ex.name}
                                            loading="lazy"
                                            style={{ width: '100%', height: 64, objectFit: 'contain', background: '#fff', borderRadius: 4 }}
                                            onError={e => { e.target.replaceWith(Object.assign(document.createElement('div'), { style: 'width:100%;height:64px;display:flex;align-items:center;justify-content:center;color:#888;font-size:11px', textContent: '—' })); }}
                                        />
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {ex.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {showGifResults && gifSearch.trim().length >= 2 && gifResults.length === 0 && (
                            <div style={{ marginTop: 6, padding: 'var(--spacing-sm)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                <ImageOff size={14} /> Sin resultados para "{gifSearch}"
                            </div>
                        )}

                        {/* URL manual */}
                        <div style={{ marginTop: 'var(--spacing-sm)' }}>
                            <input
                                type="url"
                                name="gifUrl"
                                value={formData.gifUrl}
                                onChange={handleChange}
                                className="input"
                                placeholder="O pega la URL del GIF directamente"
                                style={{ fontSize: '0.8rem' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: 'var(--spacing-xl)' }}>
                        <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                            <Save size={20} />
                            {initialData ? 'Guardar Cambios' : 'Añadir Ejercicio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
