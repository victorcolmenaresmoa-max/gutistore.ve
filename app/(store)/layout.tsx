import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="store-shell">
      <Navbar />
      <main id="contenido" className="store-main">
        {children}
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
