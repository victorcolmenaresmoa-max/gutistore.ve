'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getConfig } from '@/lib/api';

interface CurrencyContextValue {
  /** Bolívares por 1 USD. 0 significa "no configurada". */
  rate: number;
  loading: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue>({
  rate: 0,
  loading: true,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [rate, setRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      const response = await getConfig();
      if (!active) return;
      if (response.ok && response.data && Number.isFinite(response.data.tasaBs)) {
        setRate(Number(response.data.tasaBs) || 0);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <CurrencyContext.Provider value={{ rate, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
