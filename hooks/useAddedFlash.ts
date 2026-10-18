'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Estado breve de "¡Agregado!" para dar respuesta visual a un botón. */
export function useAddedFlash(duration = 1400) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const flash = useCallback(() => {
    window.clearTimeout(timer.current);
    setAdded(true);
    timer.current = window.setTimeout(() => setAdded(false), duration);
  }, [duration]);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [added, flash] as const;
}
