'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { deleteMedia, uploadMedia } from '@/lib/api';
import Icon from './Icons';
import ConfirmDialog from './ConfirmDialog';

export default function MediaManager({ value, onChange, folder = 'products', max = 8, label = 'Imágenes', single = false }: { value: string[]; onChange: (urls: string[]) => void; folder?: string; max?: number; label?: string; single?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    const selected = Array.from(files).slice(0, single ? 1 : Math.max(0, max - value.length));
    if (!selected.length) return;
    setUploading(true);
    const response = await uploadMedia(selected, folder);
    setUploading(false);
    if (response.ok && response.data) onChange(single ? response.data.urls.slice(0, 1) : [...value, ...response.data.urls].slice(0, max));
    else setError(response.message || 'No fue posible subir la imagen.');
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = async () => {
    if (deleteIndex === null) return;
    const url = value[deleteIndex];
    setDeleting(true);
    const response = await deleteMedia(url);
    setDeleting(false);
    if (!response.ok) setError(response.message || 'No se pudo eliminar la imagen del almacenamiento.');
    onChange(value.filter((_, index) => index !== deleteIndex));
    setDeleteIndex(null);
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return <div className="media-manager"><div className="media-manager-head"><div><label>{label}</label><small>{single ? 'Selecciona una imagen desde tu dispositivo.' : `La primera imagen será la portada. Máximo ${max}.`}</small></div><button type="button" className="btn btn-outline btn-sm" onClick={() => inputRef.current?.click()} disabled={uploading || value.length >= max}><Icon name="plus" size={15} /> {uploading ? 'Subiendo...' : 'Subir imagen'}</button><input ref={inputRef} type="file" accept="image/*" capture={false} multiple={!single} hidden onChange={(event) => void upload(event.target.files)} /></div>{error && <div className="alert alert-error">{error}</div>}{value.length > 0 ? <div className={`media-grid ${single ? 'single' : ''}`}>{value.map((url, index) => <article className="media-item" key={`${url}-${index}`}><div className="media-preview"><Image src={url} alt={`Imagen ${index + 1}`} fill sizes="150px" />{index === 0 && !single && <span>Portada</span>}</div><div className="media-actions">{!single && <><button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Mover a la izquierda">←</button><button type="button" onClick={() => move(index, 1)} disabled={index === value.length - 1} aria-label="Mover a la derecha">→</button></>}<button type="button" className="danger" onClick={() => setDeleteIndex(index)} aria-label="Eliminar imagen"><Icon name="trash" size={14} /></button></div></article>)}</div> : <div className="media-empty"><Icon name="package" size={26} /><span>No hay imágenes cargadas.</span></div>}<ConfirmDialog open={deleteIndex !== null} title="¿Eliminar esta imagen?" message="Se quitará del formulario y, si pertenece al almacenamiento de GutiStore, también se eliminará de Supabase Storage." confirmLabel="Eliminar imagen" destructive loading={deleting} onCancel={() => setDeleteIndex(null)} onConfirm={() => void remove()} /></div>;
}
