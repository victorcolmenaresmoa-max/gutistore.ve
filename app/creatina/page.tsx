import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import CreatinaScrollTelling from '@/components/CreatinaScrollTelling';
import './creatina.css';

export const metadata: Metadata = {
  title: 'Creatina Monohidratada | GutiSupplements',
  description:
    'El envase, el polvo micronizado y lo que la creatina monohidratada hace dentro del músculo. Nutrex Research, 1000 g.',
};

export default function CreatinaPage() {
  return (
    <>
      <Navbar />
      <CreatinaScrollTelling />

      <footer className="footer">
        <div className="container footer-bottom">
          <p>© {new Date().getFullYear()} GutiSupplements. Todos los derechos reservados.</p>
          <p className="footer-bottom-tag">Hecho con dedicación para tu bienestar.</p>
        </div>
      </footer>
    </>
  );
}
