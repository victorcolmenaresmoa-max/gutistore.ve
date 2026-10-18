'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

/**
 * Efectos interactivos globales de la tienda:
 *  1. Aparición al hacer scroll (tarjetas, secciones, títulos) con cascada.
 *  2. Onda al tocar botones.
 *  3. Inclinación 3D y brillo de las tarjetas de producto al pasar el mouse.
 *  4. Barra roja de progreso de lectura en la parte superior.
 *
 * Todo se desactiva si el sistema pide reducir movimiento.
 */

/** Elementos que aparecen al entrar en pantalla. */
const REVEAL_SELECTOR = [
  '.product-card:not(.product-card-skeleton)',
  '.category-tile',
  '.promo-card',
  '.section-heading',
  '.how-step',
  '.how-intro',
  '.how-facts > *',
  '.faq-item',
  '.footer-col',
  '.footer-about',
  '.form-card',
  '.summary-card',
  '.pdp-info > *',
  '.pdp-gallery',
  '.success-steps li',
  '.catalog-toolbar',
].join(',');

/** Botones que muestran la onda al tocarlos. */
const RIPPLE_SELECTOR = '.btn, .card-quick-add, .nav-icon-btn, .chip, .filter-chip, .variant-option, .qty-stepper button, .toast-action';

const STAGGER_MS = 70;
const MAX_STAGGER_MS = 420;

export default function MotionEffects() {
  const pathname = usePathname();
  const progressRef = useRef<HTMLDivElement>(null);

  // 1. Aparición al hacer scroll.
  useEffect(() => {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) return;

    const seen = new WeakSet<Element>();
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
        visible.forEach((entry, index) => {
          const element = entry.target as HTMLElement;
          element.style.setProperty('--rv-delay', `${Math.min(index * STAGGER_MS, MAX_STAGGER_MS)}ms`);
          element.classList.add('rv-in');
          observer.unobserve(element);
          // Al terminar se quitan las clases para no interferir con otros efectos.
          window.setTimeout(() => {
            element.classList.remove('rv', 'rv-in');
            element.style.removeProperty('--rv-delay');
          }, 900 + Math.min(index * STAGGER_MS, MAX_STAGGER_MS));
        });
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.08 }
    );

    const scan = (root: ParentNode) => {
      root.querySelectorAll<HTMLElement>(REVEAL_SELECTOR).forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        element.classList.add('rv');
        observer.observe(element);
      });
    };

    scan(document);
    // Los productos llegan después de cargar: se vigilan los nodos nuevos.
    let queued = false;
    const mutation = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        scan(document);
      });
    });
    const main = document.querySelector('.store-shell') || document.body;
    mutation.observe(main, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, [pathname]);

  // 2. Onda al tocar botones.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const onDown = (event: PointerEvent) => {
      const target = (event.target as Element | null)?.closest<HTMLElement>(RIPPLE_SELECTOR);
      if (!target || (target as HTMLButtonElement).disabled) return;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2.2;
      // La onda va dentro de un contenedor recortado propio, así no se recorta
      // nada del botón (por ejemplo el contador del carrito).
      if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
      const wrap = document.createElement('span');
      wrap.className = 'ripple-wrap';
      wrap.setAttribute('aria-hidden', 'true');
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
      wrap.appendChild(ripple);
      target.appendChild(wrap);
      window.setTimeout(() => wrap.remove(), 650);
    };
    document.addEventListener('pointerdown', onDown, { passive: true });
    return () => document.removeEventListener('pointerdown', onDown);
  }, []);

  // 3. Inclinación 3D de tarjetas (solo con mouse).
  useEffect(() => {
    if (prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let active: HTMLElement | null = null;
    let frame = 0;
    let pending: PointerEvent | null = null;

    const reset = (card: HTMLElement | null) => {
      if (!card) return;
      card.classList.remove('is-tilting');
      card.style.removeProperty('--rx');
      card.style.removeProperty('--ry');
      card.style.removeProperty('--gx');
      card.style.removeProperty('--gy');
    };

    const apply = () => {
      frame = 0;
      if (!pending) return;
      const media = (pending.target as Element | null)?.closest<HTMLElement>('.product-card-media, .category-tile-media, .promo-media') ?? null;
      if (media !== active) {
        reset(active);
        active = media;
      }
      if (!media) return;
      const rect = media.getBoundingClientRect();
      const x = (pending.clientX - rect.left) / rect.width;
      const y = (pending.clientY - rect.top) / rect.height;
      media.classList.add('is-tilting');
      media.style.setProperty('--ry', `${(x - 0.5) * 9}deg`);
      media.style.setProperty('--rx', `${(0.5 - y) * 9}deg`);
      media.style.setProperty('--gx', `${x * 100}%`);
      media.style.setProperty('--gy', `${y * 100}%`);
    };

    const onMove = (event: PointerEvent) => {
      pending = event;
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onLeave = () => {
      reset(active);
      active = null;
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      reset(active);
    };
  }, []);

  // 4. Barra de progreso de lectura.
  useEffect(() => {
    const bar = progressRef.current;
    if (!bar) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = `scaleX(${progress})`;
      document.documentElement.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  return <div className="scroll-progress" ref={progressRef} aria-hidden="true" />;
}
