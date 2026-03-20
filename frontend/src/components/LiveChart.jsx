import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';

export default function LiveChart({ readings = [] }) {
  // Build chart data: group by timestamp, show avg resistivity per scan
  const chartData = useMemo(() => {
    const byTs = {};
    readings.forEach(r => {
      const bucket = Math.floor(r.timestamp_ms / 30000) * 30000;
      if (!byTs[bucket]) byTs[bucket] = { ts: bucket, rhoValues: [] };
      byTs[bucket].rhoValues.push(r.resistivity);
    });
    return Object.values(byTs)
      .sort((a, b) => a.ts - b.ts)
      .slice(-30)
      .map(b => ({
        time:    new Date(b.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        avgRho:  +(b.rhoValues.reduce((s, v) => s + v, 0) / b.rhoValues.length).toFixed(2),
        minRho:  +Math.min(...b.rhoValues).toFixed(2),
        maxRho:  +Math.max(...b.rhoValues).toFixed(2),
      }));
  }, [readings]);

  if (chartData.length === 0) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--color-text-tertiary)', fontSize: 13 }}>
        Waiting for data…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-tertiary)" />
        <XAxis dataKey="time" tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }} />
        <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-tertiary)' }}
          label={{ value: 'Ω·m', angle: -90, position: 'insideLeft', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border-secondary)', borderRadius: 8, fontSize: 12 }}
          formatter={(v, name) => [`${v} Ω·m`, name]} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="avgRho" name="Avg ρ"
          stroke="#378ADD" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="minRho" name="Min ρ"
          stroke="#1D9E75" strokeWidth={1} dot={false} strokeDasharray="4 2" />
        <Line type="monotone" dataKey="maxRho" name="Max ρ"
          stroke="#E24B4A" strokeWidth={1} dot={false} strokeDasharray="4 2" />
      </LineChart>
    </ResponsiveContainer>
  );
}
