import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import '@fontsource-variable/archivo/wdth.css';
import './globals.css';
import SellerReferralTracker from '@/components/SellerReferralTracker';
import Providers from '@/components/layout/Providers';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'GutiStore | Ropa, calzado, accesorios y suplementos',
    template: '%s | GutiStore',
  },
  description:
    'Tienda online de ropa deportiva, calzado, lentes, accesorios, hidratación y suplementos. Precios en USD y Bs, pedido en minutos y confirmación personalizada.',
  applicationName: 'GutiStore',
  openGraph: {
    type: 'website',
    locale: 'es_VE',
    siteName: 'GutiStore',
    title: 'GutiStore | Entrena. Viste. Vive.',
    description: 'Ropa, calzado, accesorios y suplementos en un solo lugar.',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#0B0B0B',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <a href="#contenido" className="skip-link">
          Saltar al contenido
        </a>
        <SellerReferralTracker />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
