/**
 * Animaciones interactivas de GutiStore (solo navegador).
 *
 * - flyToCart: la foto del producto vuela en arco hasta el ícono del carrito.
 * - sparkBurst: chispas que salen de un punto (botones, carrito, confirmación).
 * - confettiRain: lluvia de confeti para la página de pedido confirmado.
 *
 * Todo respeta "reducir movimiento" del sistema: en ese caso no se anima nada
 * y solo se avisa al carrito para que actualice su contador.
 */

export const CART_HIT_EVENT = 'gs:cart-hit';

const BRAND_COLORS = ['#fc1d2d', '#e01020', '#0d0d0d', '#ffffff', '#ff6b74', '#ffb3b8'];

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function canAnimate() {
  return typeof document !== 'undefined' && typeof Element !== 'undefined' && 'animate' in Element.prototype;
}

/** Avisa al ícono del carrito que "recibió" un producto (se sacude y rebota el contador). */
export function notifyCartHit() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CART_HIT_EVENT));
}

function cartTarget(): DOMRect | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>('[data-cart-target]'));
  for (const element of candidates) {
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight) return rect;
  }
  return null;
}

function imageSource(element: Element | null): string {
  if (!element) return '';
  const img = element instanceof HTMLImageElement ? element : element.querySelector('img');
  if (!img) return '';
  return img.currentSrc || img.src || '';
}

/** Punto de una curva cuadrática de Bézier. */
function quad(a: number, control: number, b: number, t: number) {
  return (1 - t) * (1 - t) * a + 2 * (1 - t) * t * control + t * t * b;
}

/**
 * Hace volar la imagen del producto hasta el carrito.
 * @param trigger botón que se pulsó; la imagen se busca en el contenedor
 *                más cercano con [data-fly-root] (o se usa el propio botón).
 */
export function flyToCart(trigger: Element | null) {
  if (!trigger || prefersReducedMotion() || !canAnimate()) {
    notifyCartHit();
    return;
  }

  const root = trigger.closest('[data-fly-root]');
  const sourceImage = root?.querySelector('[data-fly-image] img, [data-fly-image]') || root?.querySelector('img') || null;
  const startEl = (sourceImage as Element | null) || trigger;
  const start = startEl.getBoundingClientRect();
  const end = cartTarget();

  // Chispas en el botón que se pulsó.
  const button = trigger.getBoundingClientRect();
  sparkBurst(button.left + button.width / 2, button.top + button.height / 2, { count: 10, distance: 46 });

  if (!end) {
    notifyCartHit();
    return;
  }

  const size = Math.max(56, Math.min(140, Math.min(start.width, start.height)));
  const startX = start.left + start.width / 2 - size / 2;
  const startY = start.top + start.height / 2 - size / 2;
  const endX = end.left + end.width / 2 - size / 2;
  const endY = end.top + end.height / 2 - size / 2;
  // Punto de control: por encima de ambos para que el vuelo haga un arco.
  const controlX = (startX + endX) / 2 + (endX < startX ? 60 : -60);
  const controlY = Math.min(startY, endY) - Math.max(120, Math.abs(endX - startX) * 0.25);

  const flyer = document.createElement('div');
  flyer.className = 'fly-to-cart';
  flyer.setAttribute('aria-hidden', 'true');
  flyer.style.width = `${size}px`;
  flyer.style.height = `${size}px`;
  const src = imageSource(sourceImage);
  if (src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    flyer.appendChild(img);
  } else {
    flyer.classList.add('fly-to-cart-dot');
  }
  document.body.appendChild(flyer);

  const steps = 14;
  const frames: Keyframe[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = quad(startX, controlX, endX, t);
    const y = quad(startY, controlY, endY, t);
    const scale = i === 0 ? 1 : 1 - 0.82 * t;
    const rotate = -14 * Math.sin(t * Math.PI);
    frames.push({
      transform: `translate(${x}px, ${y}px) scale(${i === 1 ? 1.08 : scale}) rotate(${rotate}deg)`,
      opacity: t > 0.92 ? 0.4 : 1,
    });
  }

  const animation = flyer.animate(frames, { duration: 820, easing: 'cubic-bezier(0.45, 0, 0.25, 1)', fill: 'forwards' });
  const finish = () => {
    flyer.remove();
    notifyCartHit();
    sparkBurst(end.left + end.width / 2, end.top + end.height / 2, { count: 14, distance: 40, size: 6 });
  };
  animation.onfinish = finish;
  animation.oncancel = () => flyer.remove();
}

/** Chispas que salen en círculo desde un punto de la pantalla. */
export function sparkBurst(
  x: number,
  y: number,
  { count = 12, distance = 54, size = 7, colors = BRAND_COLORS }: { count?: number; distance?: number; size?: number; colors?: string[] } = {}
) {
  if (prefersReducedMotion() || !canAnimate()) return;
  const layer = document.createElement('div');
  layer.className = 'spark-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.left = `${x}px`;
  layer.style.top = `${y}px`;
  document.body.appendChild(layer);

  let pending = count;
  for (let i = 0; i < count; i += 1) {
    const spark = document.createElement('span');
    spark.className = 'spark';
    const color = colors[i % colors.length];
    const s = size * (0.6 + Math.random() * 0.7);
    spark.style.width = `${s}px`;
    spark.style.height = `${s}px`;
    spark.style.background = color;
    if (color === '#ffffff') spark.style.boxShadow = '0 0 0 1px rgba(0,0,0,0.25)';
    layer.appendChild(spark);

    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6;
    const reach = distance * (0.65 + Math.random() * 0.6);
    const dx = Math.cos(angle) * reach;
    const dy = Math.sin(angle) * reach;
    const animation = spark.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 1, offset: 0.6 },
        { transform: `translate(calc(-50% + ${dx * 1.15}px), calc(-50% + ${dy * 1.15 + 10}px)) scale(0)`, opacity: 0 },
      ],
      { duration: 560 + Math.random() * 240, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)', fill: 'forwards' }
    );
    animation.onfinish = () => {
      pending -= 1;
      if (pending <= 0) layer.remove();
    };
  }
}

/** Lluvia de confeti a pantalla completa (se limpia sola). */
export function confettiRain({ pieces = 140, duration = 3200 }: { pieces?: number; duration?: number } = {}) {
  if (prefersReducedMotion() || typeof document === 'undefined') return () => undefined;
  const canvas = document.createElement('canvas');
  canvas.className = 'confetti-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return () => undefined;
  document.body.appendChild(canvas);

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = window.innerWidth * ratio;
    canvas.height = window.innerHeight * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const width = () => window.innerWidth;
  type Piece = { x: number; y: number; vx: number; vy: number; w: number; h: number; r: number; vr: number; color: string; wobble: number };
  const all: Piece[] = Array.from({ length: pieces }, (_, i) => {
    // Dos cañones desde las esquinas inferiores y una lluvia desde arriba.
    const fromLeft = i % 3 === 0;
    const fromRight = i % 3 === 1;
    return {
      x: fromLeft ? 0 : fromRight ? width() : Math.random() * width(),
      y: fromLeft || fromRight ? window.innerHeight * 0.75 : -20 - Math.random() * 200,
      vx: fromLeft ? 4 + Math.random() * 7 : fromRight ? -4 - Math.random() * 7 : (Math.random() - 0.5) * 2,
      vy: fromLeft || fromRight ? -10 - Math.random() * 9 : 1 + Math.random() * 2,
      w: 6 + Math.random() * 6,
      h: 9 + Math.random() * 8,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: BRAND_COLORS[i % BRAND_COLORS.length],
      wobble: Math.random() * 10,
    };
  });

  const started = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const elapsed = now - started;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const fade = elapsed > duration - 700 ? Math.max(0, (duration - elapsed) / 700) : 1;
    context.globalAlpha = fade;
    for (const p of all) {
      p.vy += 0.28;
      p.vx *= 0.985;
      p.vy = Math.min(p.vy, 6);
      p.wobble += 0.12;
      p.x += p.vx + Math.sin(p.wobble) * 0.6;
      p.y += p.vy;
      p.r += p.vr;
      context.save();
      context.translate(p.x, p.y);
      context.rotate(p.r);
      context.scale(1, Math.cos(p.wobble));
      context.fillStyle = p.color;
      context.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      if (p.color === '#ffffff') {
        context.strokeStyle = 'rgba(0,0,0,0.15)';
        context.strokeRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      context.restore();
    }
    if (elapsed < duration) frame = requestAnimationFrame(tick);
    else stop();
  };
  const stop = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    canvas.remove();
  };
  frame = requestAnimationFrame(tick);
  return stop;
}
