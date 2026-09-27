import type { Product, ProductVariant } from '@/types';
import Icon from '@/components/Icons';
import { benefitsList } from '@/lib/product';

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

/**
 * Información del producto en acordeones. Solo aparecen las secciones que
 * tienen contenido real: una camisa muestra material y talla; un suplemento,
 * beneficios, ingredientes y modo de uso.
 */
export default function ProductInfoSections({ product, variant }: { product: Product; variant: ProductVariant | null }) {
  const benefits = benefitsList(product);
  const sku = variant?.sku || product.sku;

  const specs: Array<[string, string]> = (
    [
      ['Marca', product.marca],
      ['Categoría', [product.categoria, product.subcategoria].filter(Boolean).join(' / ')],
      ['Material', product.material],
      ['Género', product.genero],
      ['Presentación', product.presentacion],
      ['Peso / capacidad', product.capacidad],
      ['SKU', sku],
      ...product.especificaciones.map((spec) => [spec.nombre, spec.valor] as [string, string]),
    ] as Array<[string, string]>
  ).filter(([, value]) => Boolean(value && value.trim()));

  const sections: Section[] = [];

  if (product.descripcion) {
    sections.push({
      id: 'descripcion',
      title: 'Descripción',
      content: product.descripcion.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>),
    });
  }
  if (product.caracteristicas.length) {
    sections.push({
      id: 'caracteristicas',
      title: 'Características',
      content: (
        <ul className="check-list">
          {product.caracteristicas.map((item, index) => (
            <li key={`${item}-${index}`}>
              <Icon name="check" size={15} /> <span>{item}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (specs.length) {
    sections.push({
      id: 'especificaciones',
      title: 'Especificaciones',
      content: (
        <dl className="spec-table">
          {specs.map(([label, value], index) => (
            <div key={`${label}-${index}`}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ),
    });
  }
  if (benefits.length) {
    sections.push({
      id: 'beneficios',
      title: 'Beneficios',
      content: (
        <>
          <ul className="check-list">
            {benefits.map((item, index) => (
              <li key={`${item}-${index}`}>
                <Icon name="check" size={15} /> <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="info-disclaimer">
            Información referencial del producto. No sustituye la orientación de un profesional de la salud.
          </p>
        </>
      ),
    });
  }
  if (product.ingredientes) {
    sections.push({ id: 'ingredientes', title: 'Ingredientes', content: <p>{product.ingredientes}</p> });
  }
  if (product.modoUso) {
    sections.push({ id: 'modo-uso', title: 'Modo de uso', content: <p>{product.modoUso}</p> });
  }
  if (product.informacionAdicional) {
    sections.push({ id: 'adicional', title: 'Información adicional', content: <p>{product.informacionAdicional}</p> });
  }

  if (!sections.length) return null;

  return (
    <div className="info-accordion">
      {sections.map((section, index) => (
        <details key={section.id} className="info-section" open={index === 0}>
          <summary>
            <span>{section.title}</span>
            <Icon name="chevronDown" size={18} />
          </summary>
          <div className="info-section-body">{section.content}</div>
        </details>
      ))}
    </div>
  );
}
