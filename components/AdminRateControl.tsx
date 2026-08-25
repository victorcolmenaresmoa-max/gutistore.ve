'use client';

import { useEffect, useState } from 'react';
import Icon from './Icons';

interface Props {
  rate: number;
  onSave: (rate: number) => Promise<boolean>;
}

export default function AdminRateControl({ rate, onSave }: Props) {
  const [value, setValue] = useState(rate > 0 ? String(rate) : '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(rate > 0 ? String(rate) : '');
  }, [rate]);

  const handleSave = async () => {
    setError('');
    setSaved(false);

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setError('Ingresa un número válido (0 para mostrar solo USD).');
      return;
    }

    setSaving(true);
    const ok = await onSave(parsed);
    setSaving(false);

    if (ok) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } else {
      setError('No se pudo guardar la tasa. Inténtalo nuevamente.');
    }
  };

  return (
    <section className="admin-panel admin-rate-panel">
      <div className="admin-panel-heading">
        <div>
          <span className="eyebrow">Moneda</span>
          <h3>Tasa de cambio USD → Bs</h3>
        </div>
        <span className="admin-rate-current">
          {rate > 0 ? `Bs ${rate}` : 'Sin configurar'}
        </span>
      </div>

      <p className="admin-rate-help">
        Los precios se guardan en USD. Indica cuántos bolívares equivalen a <strong>1 USD</strong> y
        la tienda mostrará ambos precios automáticamente. Déjalo en 0 para mostrar solo USD.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-rate-row">
        <div className="field">
          <label htmlFor="tasa-bs">Bolívares por 1 USD</label>
          <div className="input-prefix">
            <span>Bs</span>
            <input
              id="tasa-bs"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="Ej. 40.00"
              inputMode="decimal"
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <span className="spinner" /> : <><Icon name="check" size={16} /> Guardar tasa</>}
        </button>
      </div>

      {saved && (
        <div className="admin-rate-saved">
          <Icon name="check" size={15} /> Tasa actualizada correctamente.
        </div>
      )}
    </section>
  );
}
