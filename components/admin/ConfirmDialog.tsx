'use client';

import { useRef } from 'react';
import Icon from '@/components/Icons';
import { useDialog } from '@/hooks/useDialog';

export interface ConfirmRequest {
  title: string;
  description?: string;
  confirmLabel?: string;
  tone?: 'danger' | 'default';
  onConfirm: () => void | Promise<void>;
}

/** Diálogo de confirmación accesible (reemplaza window.confirm). */
export default function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialog(Boolean(request), ref, onClose);
  if (!request) return null;

  return (
    <div className="modal-root" role="presentation">
      <button type="button" className="drawer-backdrop" aria-label="Cancelar" onClick={onClose} />
      <div className="modal-card confirm-card" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" ref={ref} tabIndex={-1}>
        <span className={`confirm-icon ${request.tone === 'danger' ? 'danger' : ''}`}>
          <Icon name={request.tone === 'danger' ? 'trash' : 'info'} size={22} />
        </span>
        <h2 id="confirm-title">{request.title}</h2>
        {request.description && <p>{request.description}</p>}
        <div className="confirm-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} data-autofocus>
            Cancelar
          </button>
          <button
            type="button"
            className={`btn ${request.tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={async () => {
              onClose();
              await request.onConfirm();
            }}
          >
            {request.confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
