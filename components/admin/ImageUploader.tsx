'use client';

import { DragEvent, useId, useRef, useState } from 'react';
import Icon from '@/components/Icons';
import ProductImage from '@/components/ProductImage';
import { IMAGE_ACCEPT, UploadFolder, uploadImageFile } from '@/lib/upload';

function useDropzone(onFiles: (files: File[]) => void, disabled: boolean) {
  const [over, setOver] = useState(false);
  return {
    over,
    handlers: {
      onDragOver: (event: DragEvent) => {
        if (disabled) return;
        event.preventDefault();
        setOver(true);
      },
      onDragLeave: () => setOver(false),
      onDrop: (event: DragEvent) => {
        event.preventDefault();
        setOver(false);
        if (disabled) return;
        const files = Array.from(event.dataTransfer.files || []).filter((file) => file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name));
        if (files.length) onFiles(files);
      },
    },
  };
}

/**
 * Una sola foto (principal de producto, promoción, categoría o variante).
 * Se elige desde el dispositivo: galería, cámara o archivos.
 */
export function ImageUploader({
  value,
  onChange,
  folder,
  label,
  hint,
  size = 'lg',
}: {
  value: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  label?: string;
  hint?: string;
  size?: 'lg' | 'sm';
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      onChange(await uploadImageFile(file, folder));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir la foto.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const drop = useDropzone((files) => void handleFiles(files), uploading);
  const pick = () => inputRef.current?.click();

  if (size === 'sm') {
    return (
      <div className="uploader-sm">
        <button
          type="button"
          className={`uploader-sm-thumb ${drop.over ? 'is-over' : ''}`}
          onClick={pick}
          disabled={uploading}
          aria-label={value ? 'Cambiar foto' : 'Subir foto'}
          title={value ? 'Cambiar foto' : 'Subir foto'}
          {...drop.handlers}
        >
          {uploading ? <span className="spinner" aria-hidden="true" /> : value ? <ProductImage src={value} alt="" /> : <Icon name="upload" size={17} />}
        </button>
        {value && !uploading && (
          <button type="button" className="admin-icon-btn danger" onClick={() => onChange('')} aria-label="Quitar foto" title="Quitar foto">
            <Icon name="close" size={13} />
          </button>
        )}
        <input ref={inputRef} id={inputId} type="file" accept={IMAGE_ACCEPT} hidden onChange={(e) => void handleFiles(Array.from(e.target.files || []))} />
        {error && <span className="uploader-sm-error" role="alert" title={error}><Icon name="alert" size={14} /></span>}
      </div>
    );
  }

  return (
    <div className="uploader">
      {label && (
        <label className="field-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className={`uploader-box ${drop.over ? 'is-over' : ''} ${value ? 'has-image' : ''}`} {...drop.handlers}>
        {value ? (
          <div className="uploader-preview">
            <ProductImage src={value} alt="Vista previa" />
          </div>
        ) : (
          <button type="button" className="uploader-empty" onClick={pick} disabled={uploading}>
            {uploading ? <span className="spinner" aria-hidden="true" /> : <Icon name="upload" size={22} />}
            <strong>{uploading ? 'Subiendo foto…' : 'Subir foto'}</strong>
            <small>Toca para elegir desde tu galería o cámara, o arrastra la foto aquí</small>
          </button>
        )}
        {value && (
          <div className="uploader-actions">
            <button type="button" className="btn btn-outline-dark btn-sm" onClick={pick} disabled={uploading}>
              {uploading ? <span className="spinner" aria-hidden="true" /> : <Icon name="upload" size={15} />}
              {uploading ? 'Subiendo…' : 'Cambiar foto'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={() => onChange('')} disabled={uploading}>
              <Icon name="trash" size={15} /> Quitar
            </button>
          </div>
        )}
      </div>
      <input ref={inputRef} id={inputId} type="file" accept={IMAGE_ACCEPT} hidden onChange={(e) => void handleFiles(Array.from(e.target.files || []))} />
      {error && (
        <p className="field-error" role="alert">
          <Icon name="alert" size={14} /> {error}
        </p>
      )}
      {hint && <small className="field-hint">{hint}</small>}
    </div>
  );
}

/**
 * Botón para añadir varias fotos a una galería de una sola vez.
 */
export function GalleryUploadButton({
  folder,
  onUploaded,
  label = 'Agregar fotos',
}: {
  folder: UploadFolder;
  onUploaded: (urls: string[]) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const handleFiles = async (files: File[]) => {
    if (!files.length) return;
    setError('');
    const urls: string[] = [];
    const errors: string[] = [];
    setProgress({ done: 0, total: files.length });
    for (const [index, file] of files.slice(0, 12).entries()) {
      try {
        urls.push(await uploadImageFile(file, folder));
      } catch (err) {
        errors.push(err instanceof Error ? err.message : 'Error');
      }
      setProgress({ done: index + 1, total: files.length });
    }
    if (urls.length) onUploaded(urls);
    if (errors.length) setError(`${errors.length} foto(s) no se pudieron subir: ${errors[0]}`);
    if (files.length > 12) setError('Solo se suben 12 fotos a la vez.');
    setProgress(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const drop = useDropzone((files) => void handleFiles(files), Boolean(progress));

  return (
    <div className={`gallery-uploader ${drop.over ? 'is-over' : ''}`} {...drop.handlers}>
      <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => inputRef.current?.click()} disabled={Boolean(progress)}>
        {progress ? <span className="spinner" aria-hidden="true" /> : <Icon name="upload" size={15} />}
        {progress ? `Subiendo ${progress.done + 1 > progress.total ? progress.total : progress.done + 1} de ${progress.total}…` : label}
      </button>
      <small className="field-hint">Puedes elegir varias a la vez o arrastrarlas aquí.</small>
      <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} multiple hidden onChange={(e) => void handleFiles(Array.from(e.target.files || []))} />
      {error && (
        <p className="field-error" role="alert">
          <Icon name="alert" size={14} /> {error}
        </p>
      )}
    </div>
  );
}
