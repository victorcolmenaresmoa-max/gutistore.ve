import type { Metadata, Viewport } from 'next';
import './globals.css';
import SellerReferralTracker from '@/components/SellerReferralTracker';
import { CartProvider } from '@/context/CartContext';
import { CurrencyProvider } from '@/context/CurrencyContext';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL) : undefined,
  title: { default: 'GutiStore | Tu tienda, muchas categorías', template: '%s | GutiStore' },
  description: 'GutiStore es una tienda multirubro de suplementos, moda, accesorios y nuevas categorías administradas desde un solo lugar.',
  applicationName: 'GutiStore',
  icons: { icon: '/guti-store-icon.png', apple: '/guti-store-icon.png' },
  openGraph: {
    title: 'GutiStore',
    description: 'Una tienda multirubro moderna, simple y confiable.',
    images: ['/guti-store-og.jpg'],
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b0b0d' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <CurrencyProvider>
          <CartProvider>
            <SellerReferralTracker />
            {children}
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
