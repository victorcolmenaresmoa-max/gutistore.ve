'use client';

import { useEffect } from 'react';

const REVEAL_SELECTOR = '[data-reveal]:not(.reveal-in)';

/**
 * Anima la entrada de cualquier elemento marcado con `data-reveal`.
 *
 * Se monta una sola vez en el layout y observa también los nodos que React
 * añade después (catálogo, promociones, resultados de búsqueda), así que las
 * secciones nuevas también aparecen con transición sin envolver cada JSX.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const elements = () =>
      Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (reducedMotion.matches || typeof IntersectionObserver === 'undefined') {
      elements().forEach((element) => element.classList.add('reveal-in'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('reveal-in');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    const observeAll = () => elements().forEach((element) => observer.observe(element));
    observeAll();

    const mutations = new MutationObserver(observeAll);
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, []);

  return null;
}
