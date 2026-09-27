import type { Metadata } from 'next';
import CreatinaScrollTelling from '@/components/CreatinaScrollTelling';
import './creatina.css';

export const metadata: Metadata = {
  title: 'Creatina monohidratada',
  description:
    'El envase, el polvo micronizado y lo que la creatina monohidratada hace dentro del músculo. Nutrex Research, 1000 g.',
};

export default function CreatinaPage() {
  return <CreatinaScrollTelling />;
}
