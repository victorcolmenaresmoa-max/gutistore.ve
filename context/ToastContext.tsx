'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import Icon from '@/components/Icons';

type ToastTone = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: { label: string; onClick: () => void };
}

interface ToastContextValue {
  notify: (toast: Omit<Toast, 'id' | 'tone'> & { tone?: ToastTone }) => void;
}

const ToastContext = createContext<ToastContextValue>({ notify: () => undefined });

const TOAST_DURATION_MS = 4200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback<ToastContextValue['notify']>(
    (toast) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((current) => [...current.slice(-2), { ...toast, tone: toast.tone || 'success', id }]);
      window.setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((toast) => (
          <div className={`toast toast-${toast.tone}`} key={toast.id}>
            <span className="toast-icon">
              <Icon name={toast.tone === 'error' ? 'alert' : toast.tone === 'info' ? 'info' : 'check'} size={18} />
            </span>
            <div className="toast-copy">
              <strong>{toast.title}</strong>
              {toast.description && <p>{toast.description}</p>}
            </div>
            {toast.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button type="button" className="toast-close" onClick={() => dismiss(toast.id)} aria-label="Cerrar aviso">
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
