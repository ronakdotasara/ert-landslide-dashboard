import { useMemo } from 'react';

function rhoToHue(rho, min, max) {
  // Blue (low/wet/danger) → Green (normal) → Red (high/dry)
  const t = Math.max(0, Math.min(1, (rho - min) / (max - min + 1e-6)));
  if (t < 0.5) {
    // Blue → Green
    const f = t / 0.5;
    return `rgb(${Math.round(26 + f * 51)}, ${Math.round(58 + f * 102)}, ${Math.round(110 - f * 62)})`;
  } else {
    // Green → Red
    const f = (t - 0.5) / 0.5;
    return `rgb(${Math.round(77 + f * 149)}, ${Math.round(160 - f * 124)}, ${Math.round(48 - f * 34)})`;
  }
}

export default function HeatmapGrid({ readings = [] }) {
  const { grid, minRho, maxRho } = useMemo(() => {
    if (readings.length === 0) return { grid: [], minRho: 0, maxRho: 1000 };

    // Build 32×32 sparse matrix, fill from readings
    const matrix = Array.from({ length: 32 }, () => Array(32).fill(null));
    readings.forEach(r => {
      if (r.elec_a < 32 && r.elec_b < 32) {
        matrix[r.elec_a][r.elec_b] = r.resistivity;
        matrix[r.elec_b][r.elec_a] = r.resistivity;
      }
    });

    const rhos   = readings.map(r => r.resistivity);
    const minRho = Math.min(...rhos);
    const maxRho = Math.max(...rhos);

    return { grid: matrix, minRho, maxRho };
  }, [readings]);

  const SIZE = 16; // cell size in px

  if (grid.length === 0) {
    return <div style={{ height: 120, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
      No data
    </div>;
  }

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <svg width={32 * SIZE + 40} height={32 * SIZE + 40}
          style={{ display: 'block', fontFamily: 'var(--font-mono)' }}>
          {/* Axis labels (every 4) */}
          {Array.from({ length: 8 }, (_, i) => (
            <text key={i} x={i * 4 * SIZE + SIZE / 2 + 30} y={14}
              fontSize={9} fill="var(--color-text-tertiary)" textAnchor="middle">
              {i * 4}
            </text>
          ))}
          {Array.from({ length: 8 }, (_, i) => (
            <text key={i} x={16} y={i * 4 * SIZE + SIZE / 2 + 25}
              fontSize={9} fill="var(--color-text-tertiary)" textAnchor="middle">
              {i * 4}
            </text>
          ))}

          {/* Cells */}
          {grid.map((row, i) =>
            row.map((rho, j) => (
              <rect key={`${i}-${j}`}
                x={j * SIZE + 28} y={i * SIZE + 18}
                width={SIZE - 1} height={SIZE - 1}
                fill={rho !== null ? rhoToHue(rho, minRho, maxRho) : 'var(--color-border-tertiary)'}
                opacity={rho !== null ? 0.85 : 0.2}
                rx={1}>
                <title>E{i}–E{j}: {rho !== null ? rho.toFixed(1) + ' Ω·m' : 'No data'}</title>
              </rect>
            ))
          )}
        </svg>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 11,
        color: 'var(--color-text-tertiary)' }}>
        <span>Low ρ (wet)</span>
        <div style={{ width: 100, height: 8, borderRadius: 4,
          background: 'linear-gradient(to right, #1a3a6e, #4dac26, #c0392b)' }} />
        <span>High ρ (dry)</span>
        <span style={{ marginLeft: 'auto' }}>
          {minRho.toFixed(0)}–{maxRho.toFixed(0)} Ω·m
        </span>
      </div>
    </div>
  );
}
