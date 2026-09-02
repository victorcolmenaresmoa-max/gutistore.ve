'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface CountUpProps {
  /** Texto final, por ejemplo "1.2K+", "4.9" o "24 h". */
  value: string;
  durationMs?: number;
}

const NUMBER_PATTERN = /^(\D*)([\d.,]+)(.*)$/s;

function formatLike(reference: string, ratio: number) {
  const decimals = (reference.split('.')[1] || '').length;
  const target = Number(reference.replace(/,/g, ''));
  if (!Number.isFinite(target)) return reference;
  return (target * ratio).toFixed(decimals);
}

/** Anima el número de una estadística la primera vez que entra en pantalla. */
export default function CountUp({ value, durationMs = 1400 }: CountUpProps) {
  const parts = useMemo(() => value.match(NUMBER_PATTERN), [value]);
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!parts || !node) return;

    const [, prefix, numeric, suffix] = parts;

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    let start = 0;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const ratio = Math.min(1, (timestamp - start) / durationMs);
      const eased = 1 - Math.pow(1 - ratio, 3);
      setDisplay(`${prefix}${formatLike(numeric, eased)}${suffix}`);
      if (ratio < 1) frame = window.requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        frame = window.requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [value, durationMs, parts]);

  return <span ref={ref} className="count-up">{display}</span>;
}
