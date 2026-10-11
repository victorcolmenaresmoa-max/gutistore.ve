import Link from 'next/link';

/**
 * Encabezado de sección de la tienda: título a la izquierda y, si hace falta,
 * un enlace de texto a la derecha. Sin etiquetas decorativas encima.
 */
export default function SectionHeading({
  id,
  title,
  description,
  href,
  linkLabel = 'Ver todo',
  tone = 'light',
}: {
  id: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  tone?: 'light' | 'dark';
}) {
  return (
    <div className={`section-heading ${tone === 'dark' ? 'is-dark' : ''}`}>
      <div>
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {href && (
        <Link href={href} className="section-link">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
