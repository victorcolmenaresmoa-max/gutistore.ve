import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <BrandLogo />
        <span className="not-found-code">404</span>
        <h1>Esta página no está disponible.</h1>
        <p>Puede que el enlace haya cambiado o que el contenido ya no esté publicado.</p>
        <div className="not-found-actions">
          <Link href="/" className="btn btn-primary">Volver al inicio</Link>
          <Link href="/productos" className="btn btn-outline">Explorar productos</Link>
        </div>
      </div>
    </main>
  );
}
