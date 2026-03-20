import { useCallback, useEffect, useState } from 'react';

const DEVICE = 'ERT-001';

export function useSensorData(limit = 500) {
  const [readings, setReadings] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  const fetchReadings = useCallback(async () => {
    setLoading(true);
    try {
      const [dataRes, statsRes] = await Promise.all([
        fetch(`/api/readings?device=${DEVICE}&limit=${limit}`),
        fetch(`/api/readings/stats?device=${DEVICE}`),
      ]);
      const data  = await dataRes.json();
      const sData = await statsRes.json();
      setReadings(data.readings || []);
      setStats(sData.stats || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchReadings();
    const interval = setInterval(fetchReadings, 30000);
    return () => clearInterval(interval);
  }, [fetchReadings]);

  return { readings, stats, loading, error, refresh: fetchReadings };
}
