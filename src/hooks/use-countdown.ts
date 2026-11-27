import { useCallback, useEffect, useState } from 'react';

/** Contagem regressiva em segundos (ex.: "Reenviar em 42s"). */
export function useCountdown(initialSeconds = 0) {
  const [until, setUntil] = useState(() => (initialSeconds > 0 ? Date.now() + initialSeconds * 1000 : 0));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= until) {
        clearInterval(t);
        setUntil(0);
      }
    }, 500);
    return () => clearInterval(t);
  }, [until]);

  const start = useCallback((seconds: number) => {
    const n = Date.now();
    setNow(n);
    setUntil(n + seconds * 1000);
  }, []);

  const remaining = until ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
  return { remaining, start };
}
