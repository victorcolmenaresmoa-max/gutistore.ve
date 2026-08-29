import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CreatinaScrollTelling from '@/components/CreatinaScrollTelling';
import './creatina.css';

export const metadata: Metadata = {
  title: 'Creatina Monohidratada',
  description: 'Conoce esta presentación de creatina monohidratada disponible en GutiStore.',
};

export default function CreatinaPage() {
  return (
    <>
      <Navbar />
      <CreatinaScrollTelling />
      <Footer />
    </>
  );
}
