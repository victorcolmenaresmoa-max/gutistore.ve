import type { Metadata } from 'next';
import './globals.css';
import SellerReferralTracker from '@/components/SellerReferralTracker';
import ScrollReveal from '@/components/ScrollReveal';
import ScrollProgress from '@/components/ScrollProgress';
import BackToTop from '@/components/BackToTop';
import { CurrencyProvider } from '@/context/CurrencyContext';

export const metadata: Metadata = {
  title: 'GutiSupplements | Suplementos Premium',
  description:
    'Catálogo premium de suplementos con atención personalizada, precios en USD y confirmación directa.',
  icons: {
    icon: '/guti-logo.png',
    apple: '/guti-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SellerReferralTracker />
        <ScrollProgress />
        <ScrollReveal />
        <CurrencyProvider>{children}</CurrencyProvider>
        <BackToTop />
      </body>
    </html>
  );
}
