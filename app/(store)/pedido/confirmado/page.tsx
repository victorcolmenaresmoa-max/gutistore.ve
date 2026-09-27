import type { Metadata } from 'next';
import OrderSuccessView from '@/components/checkout/OrderSuccessView';

export const metadata: Metadata = {
  title: 'Pedido registrado',
  robots: { index: false },
};

export default function OrderConfirmedPage() {
  return <OrderSuccessView />;
}
