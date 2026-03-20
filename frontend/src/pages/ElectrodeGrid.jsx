import { useState } from 'react';
import ElectrodeNode from '../components/ElectrodeNode';
import { useDeviceControl } from '../hooks/useDeviceControl';
import { useSensorData } from '../hooks/useSensorData';

export default function ElectrodeGrid() {
  const { sendCommand, loading: cmdLoading } = useDeviceControl();
  const { readings } = useSensorData();
  const [selectedA, setSelectedA] = useState(null);
  const [selectedB, setSelectedB] = useState(null);

  // Compute per-electrode average resistivity from latest readings
  const electrodeStats = {};
  for (let i = 0; i < 32; i++) {
    const related = readings.filter(r => r.elec_a === i || r.elec_b === i);
    if (related.length > 0) {
      electrodeStats[i] = {
        avgRho: related.reduce((s, r) => s + r.resistivity, 0) / related.length,
        count: related.length,
      };
    }
  }

  const rhoValues = Object.values(electrodeStats).map(s => s.avgRho);
  const minRho    = Math.min(...rhoValues, 1);
  const maxRho    = Math.max(...rhoValues, 1000);

  function handleNodeClick(idx) {
    if (selectedA === null) {
      setSelectedA(idx);
    } else if (selectedB === null && idx !== selectedA) {
      setSelectedB(idx);
    } else {
      setSelectedA(idx);
      setSelectedB(null);
    }
  }

  function handleMeasurePair() {
    if (selectedA !== null && selectedB !== null) {
      sendCommand(`PAIR ${selectedA} ${selectedB}`);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>Electrode Grid</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 24 }}>
        32-electrode array. Color = average resistivity. Click two electrodes to measure that pair manually.
      </p>

      {/* Grid: 8 columns × 4 rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)',
        gap: 12, maxWidth: 600, marginBottom: 24 }}>
        {Array.from({ length: 32 }, (_, i) => (
          <ElectrodeNode
            key={i}
            index={i}
            stats={electrodeStats[i]}
            minRho={minRho}
            maxRho={maxRho}
            isSelectedA={selectedA === i}
            isSelectedB={selectedB === i}
            onClick={() => handleNodeClick(i)}
          />
        ))}
      </div>

      {/* Manual pair control */}
      <div style={{ padding: '16px 20px', background: 'var(--color-background-secondary)',
        borderRadius: 10, border: '1px solid var(--color-border-tertiary)',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 14 }}>
          Selected:{' '}
          <strong>E{selectedA ?? '—'}</strong>
          {' '}→{' '}
          <strong>E{selectedB ?? '—'}</strong>
        </div>
        <button
          onClick={handleMeasurePair}
          disabled={selectedA === null || selectedB === null || cmdLoading}
          style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13,
            background: (selectedA !== null && selectedB !== null) ? '#378ADD' : 'var(--color-background-secondary)',
            color: (selectedA !== null && selectedB !== null) ? '#fff' : 'var(--color-text-tertiary)',
            border: '1px solid var(--color-border-secondary)', cursor: 'pointer' }}>
          {cmdLoading ? 'Sending…' : 'Measure Pair'}
        </button>
        <button onClick={() => { setSelectedA(null); setSelectedB(null); }}
          style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13,
            background: 'none', border: '1px solid var(--color-border-secondary)',
            cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
          Clear
        </button>
      </div>
    </div>
  );
}
