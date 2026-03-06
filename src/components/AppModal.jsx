import { X, AlertTriangle, CheckCircle, Info, Trash2 } from 'lucide-react';

/**
 * Reusable modal component for alerts, confirmations and dialogs.
 *
 * Props:
 *  - isOpen        (bool)    show/hide
 *  - onClose       (fn)      called on overlay click, X button, or Cancel
 *  - title         (string)  heading
 *  - message       (string | ReactNode)  body content
 *  - type          ('success' | 'error' | 'warning' | 'info' | 'confirm' | 'danger')
 *  - confirmText   (string)  label for primary button  (default "Aceptar")
 *  - cancelText    (string)  label for secondary button (only shown if onCancel or type=confirm/danger)
 *  - onConfirm     (fn)      primary action
 *  - onCancel      (fn)      secondary action (defaults to onClose)
 *  - hideCancel    (bool)    force-hide cancel button
 */
export default function AppModal({
    isOpen,
    onClose,
    title = '',
    message = '',
    type = 'info',
    confirmText,
    cancelText = 'Cancelar',
    onConfirm,
    onCancel,
    hideCancel = false
}) {
    if (!isOpen) return null;

    const icons = {
        success: <CheckCircle size={28} style={{ color: 'var(--accent, #22D3A6)' }} />,
        error: <AlertTriangle size={28} style={{ color: 'var(--danger, #EF4444)' }} />,
        warning: <AlertTriangle size={28} style={{ color: 'var(--warning, #F59E0B)' }} />,
        info: <Info size={28} style={{ color: 'var(--accent, #22D3A6)' }} />,
        confirm: <Info size={28} style={{ color: 'var(--accent, #22D3A6)' }} />,
        danger: <Trash2 size={28} style={{ color: 'var(--danger, #EF4444)' }} />
    };

    const iconBgColors = {
        success: 'rgba(34, 211, 166, 0.15)',
        error: 'rgba(239, 68, 68, 0.15)',
        warning: 'rgba(245, 158, 11, 0.15)',
        info: 'rgba(34, 211, 166, 0.15)',
        confirm: 'rgba(34, 211, 166, 0.15)',
        danger: 'rgba(239, 68, 68, 0.15)'
    };

    const primaryBtnColors = {
        success: 'var(--accent, #22D3A6)',
        error: 'var(--danger, #EF4444)',
        warning: 'var(--warning, #F59E0B)',
        info: 'var(--accent, #22D3A6)',
        confirm: 'var(--accent, #22D3A6)',
        danger: 'var(--danger, #EF4444)'
    };

    const defaultConfirmText = {
        success: 'Aceptar',
        error: 'Cerrar',
        warning: 'Entendido',
        info: 'Aceptar',
        confirm: 'Confirmar',
        danger: 'Eliminar'
    };

    const showCancel = !hideCancel && (type === 'confirm' || type === 'danger' || onCancel);
    const btnLabel = confirmText || defaultConfirmText[type] || 'Aceptar';

    const handleConfirm = () => {
        if (onConfirm) onConfirm();
        else onClose();
    };

    const handleCancel = () => {
        if (onCancel) onCancel();
        else onClose();
    };

    return (
        <div
            onClick={onClose}
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
                    maxWidth: '400px',
                    width: '100%',
                    textAlign: 'center',
                    position: 'relative'
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
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

                {/* Icon */}
                <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: iconBgColors[type],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--spacing-lg)'
                }}>
                    {icons[type]}
                </div>

                {/* Title */}
                {title && (
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>{title}</h3>
                )}

                {/* Message */}
                {message && (
                    <div style={{
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        marginBottom: 'var(--spacing-xl)',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-line'
                    }}>
                        {message}
                    </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    {showCancel && (
                        <button
                            onClick={handleCancel}
                            className="btn btn-secondary"
                            style={{ flex: 1 }}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className="btn"
                        style={{
                            flex: 1,
                            background: primaryBtnColors[type],
                            color: type === 'warning' ? '#000' : 'white',
                            fontWeight: 600
                        }}
                    >
                        {btnLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

