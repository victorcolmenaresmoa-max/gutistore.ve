import type { Metadata } from 'next';
import CheckoutView from '@/components/checkout/CheckoutView';

export const metadata: Metadata = {
  title: 'Finalizar pedido',
  robots: { index: false },
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
