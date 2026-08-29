'use client';

import Icon from './Icons';

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirmar', destructive = false, loading = false, onCancel, onConfirm }: { open: boolean; title: string; message: string; confirmLabel?: string; destructive?: boolean; loading?: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return <div className="modal-backdrop confirm-backdrop" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && !loading && onCancel()}><div className="confirm-dialog"><span className={`confirm-icon ${destructive ? 'danger' : ''}`}><Icon name={destructive ? 'trash' : 'check'} size={22} /></span><h3>{title}</h3><p>{message}</p><div className="confirm-actions"><button className="btn btn-outline" onClick={onCancel} disabled={loading}>Cancelar</button><button className={`btn ${destructive ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>{loading ? <span className="spinner" /> : confirmLabel}</button></div></div></div>;
}
