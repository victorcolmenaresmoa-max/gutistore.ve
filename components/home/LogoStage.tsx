'use client';

import { CSSProperties, PointerEvent, useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion, sparkBurst } from '@/lib/motion';

/**
 * Logo animado de la portada.
 *
 * No se redibuja el logo: cada pieza (la G, las dos ruedas, cada letra de
 * "GutiStore" y del lema) es un recorte del archivo original
 * /brand/gutistore-logo.png usado como sprite. Las medidas son píxeles de ese
 * archivo (786 × 589).
 *
 * Secuencia: brillo rojo → la G se "dibuja" → llegan las ruedas → caen las
 * letras de "Guti" y saltan las de "Store" → se escribe el lema → destello.
 * Después queda vivo: la G flota, cada pocos segundos "arranca" con líneas de
 * velocidad, sigue al mouse en 3D y al tocarla hace un turbo con chispas.
 */

const W = 786;
const H = 589;
const SRC = '/brand/gutistore-logo.png';

type Box = { x: number; y: number; w: number; h: number };

const G_BOX: Box = { x: 222, y: 18, w: 339, h: 305 };
const WHEELS: Box[] = [
  { x: 341, y: 325, w: 39, h: 39 },
  { x: 433, y: 325, w: 39, h: 39 },
];
const WORD: Array<Box & { red: boolean }> = [
  { x: 18, y: 387, w: 120, h: 129, red: false },
  { x: 153, y: 425, w: 83, h: 91, red: false },
  { x: 249, y: 398, w: 56, h: 118, red: false },
  { x: 318, y: 386, w: 26, h: 128, red: false },
  { x: 355, y: 387, w: 97, h: 129, red: true },
  { x: 457, y: 398, w: 57, h: 118, red: true },
  { x: 519, y: 422, w: 94, h: 95, red: true },
  { x: 625, y: 424, w: 50, h: 90, red: true },
  { x: 678, y: 422, w: 90, h: 94, red: true },
];
const TAG: Box[] = [
  [70, 18], [100, 18], [131, 18], [161, 15], [188, 16], [216, 23], [252, 16], [280, 19], [311, 18], [340, 22], [373, 18],
  [419, 21],
  [465, 22], [493, 20], [520, 20], [548, 17], [572, 19], [598, 22], [629, 18], [656, 5], [670, 22], [699, 19],
].map(([x, w]) => ({ x, y: 547, w, h: 24 }));

const PARTICLES = 14;

/** Posición y recorte de una pieza dentro del logo (en %). */
function sprite(box: Box, extra: Record<string, string | number> = {}): CSSProperties {
  return {
    left: `${(box.x / W) * 100}%`,
    top: `${(box.y / H) * 100}%`,
    width: `${(box.w / W) * 100}%`,
    height: `${(box.h / H) * 100}%`,
    backgroundImage: `url(${SRC})`,
    backgroundSize: `${(W / box.w) * 100}% ${(H / box.h) * 100}%`,
    backgroundPosition: `${(box.x / (W - box.w)) * 100}% ${(box.y / (H - box.h)) * 100}%`,
    ...extra,
  } as CSSProperties;
}

export default function LogoStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [turbo, setTurbo] = useState(false);
  const turboTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(turboTimer.current), []);

  const onMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') return;
    const stage = stageRef.current;
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    stage.style.setProperty('--px', ((event.clientX - rect.left) / rect.width - 0.5).toFixed(3));
    stage.style.setProperty('--py', ((event.clientY - rect.top) / rect.height - 0.5).toFixed(3));
  }, []);

  const onLeave = useCallback(() => {
    stageRef.current?.style.setProperty('--px', '0');
    stageRef.current?.style.setProperty('--py', '0');
  }, []);

  // Al tocar el logo: turbo con chispas desde las ruedas.
  const onTap = useCallback(() => {
    if (prefersReducedMotion()) return;
    window.clearTimeout(turboTimer.current);
    setTurbo(false);
    requestAnimationFrame(() => setTurbo(true));
    turboTimer.current = window.setTimeout(() => setTurbo(false), 1100);
    stageRef.current?.querySelectorAll('.ls-wheel').forEach((wheel, index) => {
      const rect = wheel.getBoundingClientRect();
      window.setTimeout(
        () => sparkBurst(rect.left + rect.width / 2, rect.top + rect.height, { count: 12, distance: 60, size: 6 }),
        index * 90
      );
    });
  }, []);

  return (
    <div
      className="logo-stage"
      ref={stageRef}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={onTap}
      role="img"
      aria-label="GutiStore — Suplementos & Accesorios"
    >
      <span className="ls-particles" aria-hidden="true">
        {Array.from({ length: PARTICLES }, (_, index) => (
          <span key={index} style={{ '--i': index, '--x': `${(index * 37) % 100}%` } as CSSProperties} />
        ))}
      </span>

      <div className="ls-logo" aria-hidden="true">
        <span className="ls-glow" />

        {/* Isotipo: la G y sus ruedas se mueven juntas */}
        <div className={`ls-mark ${turbo ? 'is-turbo' : ''}`}>
          <div className="ls-drive">
            <span className="ls-speed">
              <span />
              <span />
              <span />
            </span>
            <span className="ls-speed ls-speed-turbo">
              <span />
              <span />
              <span />
            </span>
            <span className="ls-floor" />
            <span className="ls-piece ls-g" style={sprite(G_BOX)} />
            {WHEELS.map((box, index) => (
              <span key={box.x} className="ls-piece ls-wheel" style={sprite(box, { '--i': index })} />
            ))}
          </div>
        </div>

        <div className="ls-word">
          {WORD.map((box, index) => (
            <span
              key={box.x}
              className={`ls-piece ls-letter ${box.red ? 'is-red' : 'is-white'}`}
              style={sprite(box, { '--i': index })}
            />
          ))}
        </div>

        <div className="ls-tag">
          {TAG.map((box, index) => (
            <span key={box.x} className="ls-piece ls-char" style={sprite(box, { '--i': index })} />
          ))}
        </div>

        <span className="ls-shine" style={{ maskImage: `url(${SRC})`, WebkitMaskImage: `url(${SRC})` }} />
      </div>
    </div>
  );
}
