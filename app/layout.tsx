import type { Metadata } from 'next';
import './globals.css';
import SellerReferralTracker from '@/components/SellerReferralTracker';

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
      <body><SellerReferralTracker />{children}</body>
    </html>
  );
}
