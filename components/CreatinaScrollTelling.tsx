'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

/* GSAP se carga desde internet (CDN) para no tener que instalar nada
   con npm. Si algún día alguien quiere instalarlo como dependencia,
   basta con `npm install gsap` y cambiar estos imports. */
const GSAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
const SCROLLTRIGGER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
const FUENTES_URL =
  'https://fonts.googleapis.com/css2?family=Anton&family=JetBrains+Mono:wght@400;600&display=swap';

/** Carga un script una sola vez y avisa cuando ya está listo. */
function cargarScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector<HTMLScriptElement>(`script[data-cst="${src}"]`);
    if (existente) {
      if (existente.dataset.listo === '1') resolve();
      else {
        existente.addEventListener('load', () => resolve());
        existente.addEventListener('error', () => reject());
      }
      return;
    }
    const etiqueta = document.createElement('script');
    etiqueta.src = src;
    etiqueta.async = true;
    etiqueta.dataset.cst = src;
    etiqueta.onload = () => {
      etiqueta.dataset.listo = '1';
      resolve();
    };
    etiqueta.onerror = () => reject();
    document.head.appendChild(etiqueta);
  });
}

/** Añade las tipografías Anton y JetBrains Mono solo en esta página. */
function cargarFuentes() {
  if (document.querySelector('link[data-cst-fuentes]')) return;
  const enlace = document.createElement('link');
  enlace.rel = 'stylesheet';
  enlace.href = FUENTES_URL;
  enlace.setAttribute('data-cst-fuentes', '1');
  document.head.appendChild(enlace);
}

export default function CreatinaScrollTelling() {
  const raiz = useRef<HTMLDivElement>(null);
  const barra = useRef<HTMLSpanElement>(null);
  const marca = useRef<HTMLSpanElement>(null);
  const riel = useRef<HTMLElement>(null);

  useEffect(() => {
    let cancelado = false;
    let contexto: { revert: () => void } | null = null;

    cargarFuentes();

    const mostrarSinAnimacion = () => {
      raiz.current
        ?.querySelectorAll<HTMLElement>('.cst-figura__media')
        .forEach((el) => (el.style.opacity = '1'));
    };

    (async () => {
      try {
        await cargarScript(GSAP_URL);
        await cargarScript(SCROLLTRIGGER_URL);
      } catch {
        mostrarSinAnimacion();
        return;
      }
      if (cancelado || !raiz.current) return;

      const gsap = (window as any).gsap;
      const ScrollTrigger = (window as any).ScrollTrigger;
      if (!gsap || !ScrollTrigger) {
        mostrarSinAnimacion();
        return;
      }
      gsap.registerPlugin(ScrollTrigger);

      const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (sinMovimiento) {
        mostrarSinAnimacion();
        return;
      }

      contexto = gsap.context(() => {
        /* --- Las 3 imágenes: escala 0.7 → 1.2 y opacidad 0 → 1
               a lo largo de EXACTAMENTE 600px de scroll. --- */
        gsap.utils.toArray('.cst-figura__media').forEach((imagen: any) => {
          const figura = imagen.closest('.cst-figura');

          gsap.fromTo(
            imagen,
            { scale: 0.7, opacity: 0 },
            {
              scale: 1.2,
              opacity: 1,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: figura,
                start: 'top bottom',
                end: '+=600',
                scrub: true,
              },
            },
          );

          /* --- Parallax: la imagen se mueve un 20% más lento
                 que el scroll de la página. --- */
          const desplazamiento = () => 0.2 * (window.innerHeight + figura.offsetHeight) * 0.5;

          gsap.fromTo(
            imagen,
            { y: () => -desplazamiento() },
            {
              y: () => desplazamiento(),
              ease: 'none',
              scrollTrigger: {
                trigger: figura,
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        });

        /* --- Entrada suave de los textos --- */
        gsap.utils.toArray('.cst-reveal').forEach((el: any, i: number) => {
          gsap.from(el, { y: 26, opacity: 0, duration: 0.9, delay: 0.12 * i, ease: 'power2.out' });
        });

        gsap.utils.toArray('.cst-capitulo__texto > *').forEach((el: any) => {
          gsap.from(el, {
            y: 24,
            opacity: 0,
            duration: 0.7,
            ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          });
        });

        /* --- El riel se oculta al salir de la página (para no
               montarse sobre el footer de la tienda) --- */
        ScrollTrigger.create({
          trigger: raiz.current,
          start: 'top 60%',
          end: 'bottom bottom',
          onToggle: (self: any) => {
            if (riel.current) riel.current.style.opacity = self.isActive ? '1' : '0';
          },
        });

        /* --- Riel lateral: progreso y número de capítulo --- */
        ScrollTrigger.create({
          trigger: raiz.current,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self: any) => {
            if (barra.current) barra.current.style.height = `${(self.progress * 100).toFixed(1)}%`;
          },
        });

        gsap.utils.toArray('.cst-capitulo').forEach((seccion: any) => {
          ScrollTrigger.create({
            trigger: seccion,
            start: 'top 60%',
            end: 'bottom 40%',
            onToggle: (self: any) => {
              if (self.isActive && marca.current) marca.current.textContent = seccion.dataset.marca;
            },
          });
        });
      }, raiz);

      ScrollTrigger.refresh();
    })();

    return () => {
      cancelado = true;
      contexto?.revert();
    };
  }, []);

  return (
    <div className="cst" ref={raiz}>
      {/* Riel lateral: ficha técnica + progreso de lectura */}
      <aside className="cst-riel" aria-hidden="true" ref={riel}>
        <span className="cst-riel__formula">
          C<sub>4</sub>H<sub>9</sub>N<sub>3</sub>O<sub>2</sub>
        </span>
        <div className="cst-riel__barra">
          <span className="cst-riel__progreso" ref={barra} />
        </div>
        <span className="cst-riel__marca" ref={marca}>
          01 — EL ENVASE
        </span>
      </aside>

      <header className="cst-portada">
        <div className="cst-portada__interior">
          <p className="cst-eyebrow cst-reveal">Nutrex Research · 1000 g · sin sabor</p>
          <h1 className="cst-portada__titulo cst-reveal">
            <span>Creatina</span>
            <span className="cst-portada__titulo--oro">Monohidratada</span>
          </h1>
          <p className="cst-portada__bajada cst-reveal">
            El suplemento deportivo más estudiado de los últimos 30 años, contado en tres tiempos:
            el envase, el polvo y lo que ocurre dentro de tu músculo.
          </p>
          <p className="cst-portada__scroll cst-reveal">Baja para empezar</p>
        </div>
      </header>

      {/* 01 · PRESENTACIÓN */}
      <section className="cst-capitulo" data-marca="01 — EL ENVASE">
        <div className="cst-capitulo__texto">
          <p className="cst-eyebrow">01 · Presentación</p>
          <h2 className="cst-titulo">
            El bote que aguanta
            <br />
            200 entrenamientos
          </h2>
          <p className="cst-parrafo">
            Un kilo de creatina monohidratada pura, micronizada y sin sabor. Nada de mezclas, nada
            de azúcares añadidos: un solo ingrediente hecho para acompañarte todos los días durante
            meses.
          </p>
          <p className="cst-parrafo">
            La monohidratada es la forma de creatina con más respaldo científico y la que usan casi
            todos los estudios serios. Por eso sigue siendo el punto de partida, tanto si llevas
            seis meses entrenando como si llevas seis años.
          </p>
          <dl className="cst-datos">
            <div className="cst-datos__fila">
              <dt>Contenido</dt>
              <dd>1000 g (2.2 lb)</dd>
            </div>
            <div className="cst-datos__fila">
              <dt>Servicios</dt>
              <dd>200</dd>
            </div>
            <div className="cst-datos__fila">
              <dt>Porción</dt>
              <dd>5 g</dd>
            </div>
            <div className="cst-datos__fila">
              <dt>Sabor</dt>
              <dd>Neutro</dd>
            </div>
          </dl>
        </div>

        <figure className="cst-figura cst-figura--claro">
          <div className="cst-figura__marco">
            <img
              className="cst-figura__media"
              src="/creatina/creatina-nutrex.png"
              alt="Envase de Creatina Monohidratada de Nutrex Research de 1000 gramos"
              width={896}
              height={1200}
            />
          </div>
          <figcaption className="cst-figura__pie">
            Envase original de 1000 g · Nutrex Research
          </figcaption>
        </figure>
      </section>

      {/* 02 · EL SCOOP */}
      <section className="cst-capitulo cst-capitulo--invertido" data-marca="02 — EL SCOOP">
        <div className="cst-capitulo__texto">
          <p className="cst-eyebrow">02 · El scoop</p>
          <h2 className="cst-titulo">
            Micronizada:
            <br />
            se disuelve, no se asienta
          </h2>
          <p className="cst-parrafo">
            Micronizar es moler el cristal de creatina en partículas mucho más pequeñas. El polvo
            queda más fino, se reparte mejor en el líquido y deja menos residuo en el fondo del
            vaso.
          </p>
          <p className="cst-parrafo">
            Al no tener sabor, el scoop cabe en cualquier parte de tu día: agua, jugo, tu batido de
            proteína o el café de la tarde. Lo importante no es la hora exacta, es no saltarse el
            día.
          </p>
          <ul className="cst-lista">
            <li>
              <span>Dosis diaria</span> 3 a 5 g, todos los días, entrenes o no.
            </li>
            <li>
              <span>Carga inicial</span> Opcional: 20 g repartidos en 4 tomas, de 5 a 7 días.
            </li>
            <li>
              <span>Mezcla</span> Líquido tibio y 15 segundos de agitado bastan.
            </li>
          </ul>
        </div>

        <figure className="cst-figura">
          <div className="cst-figura__marco">
            <img
              className="cst-figura__media"
              src="/creatina/scoop.jpg"
              alt="Ilustración de un scoop dejando caer creatina micronizada"
              width={1200}
              height={1500}
              loading="lazy"
            />
          </div>
          <figcaption className="cst-figura__pie">
            Polvo micronizado · ilustración original
          </figcaption>
        </figure>
      </section>

      {/* 03 · BENEFICIOS */}
      <section className="cst-capitulo" data-marca="03 — LA CIENCIA">
        <div className="cst-capitulo__texto">
          <p className="cst-eyebrow">03 · Análisis de beneficios</p>
          <h2 className="cst-titulo">
            Lo que hace
            <br />
            dentro del músculo
          </h2>
          <p className="cst-parrafo">
            Tu músculo guarda creatina en forma de fosfocreatina, la reserva que regenera el ATP en
            los primeros segundos de un esfuerzo máximo. Suplementarte llena esa reserva casi hasta
            el tope, y ahí empieza todo lo demás.
          </p>
          <div className="cst-beneficios">
            <article className="cst-beneficio">
              <span className="cst-beneficio__num">Fuerza</span>
              <p>
                Más repeticiones con el mismo peso en series cortas e intensas. Con el tiempo, ese
                volumen extra de trabajo es lo que se traduce en músculo.
              </p>
            </article>
            <article className="cst-beneficio">
              <span className="cst-beneficio__num">Rendimiento</span>
              <p>
                Sprints, saltos, levantamientos: los esfuerzos explosivos de menos de 30 segundos
                son donde más se nota la reserva de fosfocreatina llena.
              </p>
            </article>
            <article className="cst-beneficio">
              <span className="cst-beneficio__num">Recuperación</span>
              <p>
                Mejor reposición de glucógeno y menos marcadores de daño muscular tras sesiones
                duras, así llegas entero a la siguiente.
              </p>
            </article>
          </div>
          <p className="cst-nota">
            Los primeros días es normal ganar algo de peso: es agua dentro del músculo, no grasa.
            Esta página es informativa; si tienes alguna condición de salud o tomas medicación,
            consulta con tu médico antes de suplementarte.
          </p>
        </div>

        <figure className="cst-figura">
          <div className="cst-figura__marco">
            <img
              className="cst-figura__media"
              src="/creatina/ciencia.jpg"
              alt="Diagrama del ciclo fosfocreatina-ATP y la molécula de creatina"
              width={1200}
              height={1500}
              loading="lazy"
            />
          </div>
          <figcaption className="cst-figura__pie">
            Ciclo fosfocreatina → ATP · ilustración original
          </figcaption>
        </figure>
      </section>

      <section className="cst-cierre">
        <h2 className="cst-cierre__titulo">¿La quieres en tu rutina?</h2>
        <p className="cst-cierre__texto">
          Revisa la disponibilidad y los precios en la tienda. Un asesor confirma stock y entrega
          antes de que pagues nada.
        </p>
        <Link href="/tienda?categoria=Suplementos" className="cst-boton">
          Ver suplementos
        </Link>
      </section>
    </div>
  );
}
