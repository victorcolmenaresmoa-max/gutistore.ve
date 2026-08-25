export default function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className={`brand-lockup ${compact ? 'brand-lockup-compact' : ''}`}>
      <span className="brand-mark">
        <img src="/guti-logo.png" alt="Logo de GutiSupplements" />
      </span>
      <span className="brand-copy">
        <strong>Guti<span>Supplements</span></strong>
        {!compact && <small>Performance · Wellness</small>}
      </span>
    </span>
  );
}
