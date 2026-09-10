import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const badgeStyles = {
  success: {
    color: 'var(--color-success)',
    borderColor: 'var(--color-success-border)',
    accent: 'var(--color-success)',
  },
  warning: {
    color: 'var(--color-warning)',
    borderColor: 'var(--color-warning-border)',
    accent: 'var(--color-warning)',
  },
  error: {
    color: 'var(--color-danger)',
    borderColor: 'var(--color-danger-border)',
    accent: 'var(--color-danger)',
  },
  info: {
    color: 'var(--color-info)',
    borderColor: 'var(--color-info-border)',
    accent: 'var(--color-info)',
  },
};

export const ToastItem = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 4000;
  const Icon = icons[toast.type] || Info;
  const styleConfig = badgeStyles[toast.type] || badgeStyles.info;

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.id, duration, onDismiss]);

  return (
    <div
      role="alert"
      className="relative overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-fadeIn"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: styleConfig.borderColor,
        color: 'var(--text-primary)',
        minWidth: '300px',
        maxWidth: '420px',
      }}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: styleConfig.color }} />
        <div className="flex-1 pr-2">
          {toast.title && (
            <p className="font-serif font-bold text-sm leading-tight mb-0.5">
              {toast.title}
            </p>
          )}
          <p className="text-xs leading-relaxed opacity-90">{toast.message}</p>
        </div>
        <button
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress countdown bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-75"
        style={{
          width: `${progress}%`,
          backgroundColor: styleConfig.accent,
        }}
      />
    </div>
  );
};

export const ToastContainer = ({ toasts, onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Notifications"
      className="fixed z-[9999] top-4 right-4 max-sm:bottom-4 max-sm:top-auto max-sm:left-4 max-sm:right-4 flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} onDismiss={onDismiss} />
        </div>
      ))}
    </aside>
  );
};

export default ToastContainer;
