import Link from 'next/link';
import BrandLogo from './BrandLogo';
import Icon from './Icons';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <BrandLogo />
          <p>Una tienda multirubro pensada para comprar con claridad, atención y una experiencia simple desde cualquier dispositivo.</p>
        </div>
        <div>
          <h4>Comprar</h4>
          <Link href="/productos">Todos los productos</Link>
          <Link href="/#categorias">Categorías</Link>
          <Link href="/#destacados">Destacados</Link>
        </div>
        <div>
          <h4>Ayuda</h4>
          <span><Icon name="message" size={15} /> Atención personalizada</span>
          <span><Icon name="truck" size={15} /> Entrega coordinada</span>
          <span><Icon name="shield" size={15} /> Solicitud segura</span>
        </div>
        <div>
          <h4>Gestión</h4>
          <Link href="/admin">Panel administrativo</Link>
        </div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} GutiStore</span><span>Suplementos, moda, accesorios y mucho más.</span></div>
    </footer>
  );
}
