export default function Loader({ label }: { label?: string }) {
  return (
    <div className="loading-block">
      <div className="spinner spinner-lg" />
      <span>{label || 'Cargando...'}</span>
    </div>
  );
}
