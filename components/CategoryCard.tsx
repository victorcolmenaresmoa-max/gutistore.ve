import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/types';
import Icon from './Icons';

export default function CategoryCard({ category }: { category: Category }) {
  return (
    <Link className="category-card" href={`/categoria/${category.slug}`}>
      <div className="category-card-media">
        {category.image ? <Image src={category.image} alt={category.name} fill sizes="(max-width: 700px) 80vw, 320px" /> : <div className="category-placeholder"><Icon name="layers" size={44} /></div>}
      </div>
      <div className="category-card-copy">
        <span>Categoría</span>
        <h3>{category.name}</h3>
        <p>{category.description || 'Explora los productos disponibles en esta categoría.'}</p>
        <strong>Ver productos <Icon name="arrowRight" size={15} /></strong>
      </div>
    </Link>
  );
}
