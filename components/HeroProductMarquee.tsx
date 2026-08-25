import Image from 'next/image';
import { HERO_SHOWCASE, type ShowcaseItem } from '@/lib/heroShowcase';

/**
 * Carrusel infinito de botes para el hero.
 *
 * Inspirado en el "Logo Carousel" de Cult UI (columnas con
 * movimiento continuo), pero reescrito para este proyecto:
 *
 *  - Sin Framer Motion ni Tailwind (el sitio no los usa).
 *  - La animación es CSS puro sobre `transform`, así que corre
 *    en la GPU y no bloquea el hilo principal.
 *  - No usa hooks ni efectos: el HTML sale completo desde el
 *    servidor, por lo que el navegador ve las imágenes antes
 *    incluso de que React hidrate.
 */

interface HeroProductMarqueeProps {
  /** Número de columnas. 3 es lo que mejor cae en el hero. */
  columns?: number;
  /** Duración base de una vuelta completa, en segundos. */
  speedSeconds?: number;
  className?: string;
}

export default function HeroProductMarquee({
  columns = 3,
  speedSeconds = 34,
  className = '',
}: HeroProductMarqueeProps) {
  if (HERO_SHOWCASE.length === 0) return null;

  // Repartimos los botes por columna en zigzag para que no queden
  // dos iguales uno al lado del otro.
  const grouped: ShowcaseItem[][] = Array.from({ length: columns }, () => []);
  HERO_SHOWCASE.forEach((item, index) => {
    grouped[index % columns].push(item);
  });

  return (
    <div
      className={`product-marquee ${className}`.trim()}
      data-columns={columns}
      role="img"
      aria-label="Selección de suplementos disponibles en el catálogo"
    >
      <div className="product-marquee-inner">
        {grouped.map((column, columnIndex) => {
          if (column.length === 0) return null;

          // Duplicamos la columna: la animación recorre exactamente
          // la primera copia y al terminar la segunda ya está en su
          // lugar, así el bucle no tiene costura visible.
          const loop = [...column, ...column];

          return (
            <div className="pm-column" key={columnIndex}>
              <div
                className="pm-track"
                style={{
                  // Cada columna va a ritmo distinto: evita el efecto
                  // "todo se mueve en bloque".
                  animationDuration: `${speedSeconds + columnIndex * 6}s`,
                  animationDirection: columnIndex % 2 === 1 ? 'reverse' : 'normal',
                }}
              >
                {loop.map((item, index) => {
                  const isDuplicate = index >= column.length;
                  // Solo el primer bote de cada columna se marca como
                  // prioritario: Next inyecta un <link rel="preload">
                  // por cada uno, y abusar de eso ralentiza el resto.
                  const isPriority = index === 0;

                  return (
                    <div
                      className="pm-item"
                      key={`${item.src}-${index}`}
                      aria-hidden={isDuplicate || undefined}
                    >
                      <Image
                        src={item.src}
                        alt={isDuplicate ? '' : item.alt}
                        width={item.width}
                        height={item.height}
                        sizes="(max-width: 620px) 28vw, 140px"
                        quality={82}
                        {...(isPriority
                          ? { priority: true }
                          : { loading: 'eager' as const })}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
