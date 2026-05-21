import { useState, useEffect } from 'react';

export function useTrendHistory(days = 7) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setLoading(true);

    async function fetchHistory() {
      try {
        const res = await fetch(`/api/history?days=${days}`, {
          signal: controller.signal,
        });
        if (cancelled) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setRecords((data.records || []).slice().reverse());
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHistory();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [days]);

  return { records, loading, error };
}
