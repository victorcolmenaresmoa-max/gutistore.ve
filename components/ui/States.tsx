import Link from 'next/link';
import Icon, { IconName } from '@/components/Icons';

export function EmptyState({
  icon = 'search',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={28} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action &&
        (action.href ? (
          <Link href={action.href} className="btn btn-primary">
            {action.label}
          </Link>
        ) : (
          <button type="button" className="btn btn-outline-dark" onClick={action.onClick}>
            {action.label}
          </button>
        ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="empty-state error-state" role="alert">
      <span className="empty-icon">
        <Icon name="alert" size={28} />
      </span>
      <h3>No pudimos cargar la información</h3>
      <p>{message || 'Hubo un problema al conectar con la tienda. Inténtalo de nuevo en unos segundos.'}</p>
      {onRetry && (
        <button type="button" className="btn btn-outline-dark" onClick={onRetry}>
          <Icon name="refresh" size={16} /> Reintentar
        </button>
      )}
    </div>
  );
}

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="loading-block" role="status">
      <span className="spinner spinner-lg" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
