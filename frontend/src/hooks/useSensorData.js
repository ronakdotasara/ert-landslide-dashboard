import { useCallback, useEffect, useState } from 'react';
import { API_BASE } from '../config';

const DEVICE = 'ERT-001';

export function useSensorData(limit = 500) {
  const [readings, setReadings] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [dataRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/api/readings?device=${DEVICE}&limit=${limit}`),
        fetch(`${API_BASE}/api/readings/stats?device=${DEVICE}`),
      ]);

      if (!dataRes.ok)  throw new Error(`Readings fetch failed: ${dataRes.status}`);
      if (!statsRes.ok) throw new Error(`Stats fetch failed: ${statsRes.status}`);

      const data  = await dataRes.json();
      const sData = await statsRes.json();

      // Backend returns { readings: [...] } and { stats: {...} }
      setReadings(Array.isArray(data.readings) ? data.readings : []);
      setStats(sData.stats ?? null);
    } catch (e) {
      console.error('[useSensorData]', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchReadings();
    const interval = setInterval(fetchReadings, 30_000);
    return () => clearInterval(interval);
  }, [fetchReadings]);

  return { readings, stats, loading, error, refresh: fetchReadings };
}