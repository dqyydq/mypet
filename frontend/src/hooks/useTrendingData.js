import { useState, useEffect } from 'react';

export function useTrendingData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    async function fetchData() {
      try {
        const res = await fetch('/api/today', { signal: controller.signal });
        if (cancelled) return;
        if (!res.ok) {
          const type = res.status >= 500 ? 'server' : 'http';
          throw new Error(JSON.stringify({ type, status: res.status }));
        }
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (cancelled) return;
        if (err.name === 'AbortError') {
          setError('timeout');
        } else if (err.message?.startsWith('{')) {
          try {
            setError(JSON.parse(err.message).type);
          } catch {
            setError('unknown');
          }
        } else if (err instanceof TypeError) {
          setError('network');
        } else {
          setError('unknown');
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    }
    fetchData();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  return { data, loading, error };
}
