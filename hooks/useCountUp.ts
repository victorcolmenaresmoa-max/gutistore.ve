'use client';

import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '@/lib/motion';

/** Anima un número desde su valor anterior hasta el nuevo (para totales y precios). */
export function useCountUp(value: number, enabled = true, duration = 600, fromZero = false) {
  const start0 = enabled && fromZero ? 0 : value;
  const [shown, setShown] = useState(start0);
  const from = useRef(start0);

  useEffect(() => {
    if (!enabled || prefersReducedMotion() || from.current === value) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const initial = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = initial + (value - initial) * eased;
      setShown(t < 1 ? current : value);
      from.current = t < 1 ? current : value;
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, enabled, duration]);

  return enabled ? shown : value;
}
