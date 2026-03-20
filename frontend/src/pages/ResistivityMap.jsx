import { useState, useEffect } from 'react';
import { useSensorData } from '../hooks/useSensorData';

const COLOR_SCALE = [
  { at: 0,    color: '#1a3a6e' },  // very low rho = wet/dangerous (blue)
  { at: 0.2,  color: '#2166ac' },
  { at: 0.4,  color: '#4dac26' },  // mid = normal (green)
  { at: 0.6,  color: '#f4a582' },
  { at: 0.8,  color: '#d6604d' },
  { at: 1.0,  color: '#b2182b' },  // very high rho = dry/rock (red)
];

function rhoToColor(rho, minRho, maxRho) {
  const t = Math.max(0, Math.min(1, (rho - minRho) / (maxRho - minRho + 1e-6)));
  for (let i = 1; i < COLOR_SCALE.length; i++) {
    if (t <= COLOR_SCALE[i].at) {
      const prev = COLOR_SCALE[i - 1];
      const curr = COLOR_SCALE[i];
      const f = (t - prev.at) / (curr.at - prev.at);
      const lerp = (a, b) => Math.round(a + (b - a) * f);
      const hex = (s) => parseInt(s, 16);
      const r = lerp(hex(prev.color.slice(1, 3)), hex(curr.color.slice(1, 3)));
      const g = lerp(hex(prev.color.slice(3, 5)), hex(curr.color.slice(3, 5)));
      const b = lerp(hex(prev.color.slice(5, 7)), hex(curr.color.slice(5, 7)));
      return `rgb(${r},${g},${b})`;
    }
  }
  return COLOR_SCALE[COLOR_SCALE.length - 1].color;
}

export default function ResistivityMap() {
  const { readings } = useSensorData();
  const [selected, setSelected] = useState(null);

  const rhos    = readings.map(r => r.resistivity);
  const minRho  = Math.min(...rhos, 1);
  const maxRho  = Math.max(...rhos, 1000);

  // Build pseudo-section: x = midpoint, z = depth
  const SPACING = 0.5;
  const gridPoints = readings.map(r => ({
    ...r,
    x:   (r.elec_a + r.elec_b) / 2 * SPACING,
    z:   Math.abs(r.elec_b - r.elec_a) * SPACING * 0.17,
    color: rhoToColor(r.resistivity, minRho, maxRho),
  }));

  const maxX = Math.max(...gridPoints.map(p => p.x), 1);
  const maxZ = Math.max(...gridPoints.map(p => p.z), 1);

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: 8 }}>Resistivity Pseudo-Section</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24, fontSize: 14 }}>
        X-axis = horizontal position along electrode array. Z-axis = investigation depth.
        Blue = low resistivity (wet/moisture risk). Red = high resistivity (dry/rock).
      </p>

      {/* Color scale legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Low ρ</span>
        <div style={{ width: 200, height: 12, borderRadius: 6,
          background: 'linear-gradient(to right, #1a3a6e, #2166ac, #4dac26, #f4a582, #b2182b)' }} />
        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>High ρ</span>
      </div>

      {/* Pseudo-section SVG */}
      <div style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: 12,
        overflow: 'hidden', background: 'var(--color-background-secondary)', padding: 16 }}>
        <svg width="100%" viewBox={`0 0 ${maxX * 120 + 80} ${maxZ * 500 + 80}`}
          style={{ display: 'block', minHeight: 200 }}>
          {gridPoints.map((pt, i) => {
            const cx = pt.x / maxX * (maxX * 120) + 40;
            const cy = pt.z / maxZ * (maxZ * 500) + 30;
            const r  = Math.max(4, Math.min(18, 300 / (readings.length + 1)));
            return (
              <circle key={i} cx={cx} cy={cy} r={r}
                fill={pt.color} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5"
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(pt)} />
            );
          })}
          {/* Axis labels */}
          <text x={40} y={maxZ * 500 + 70} fontSize="11" fill="var(--color-text-secondary)">
            0 m
          </text>
          <text x={maxX * 120 + 20} y={maxZ * 500 + 70} fontSize="11" fill="var(--color-text-secondary)">
            {maxX.toFixed(1)} m →
          </text>
        </svg>
      </div>

      {/* Tooltip */}
      {selected && (
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--color-background-secondary)',
          borderRadius: 8, border: '1px solid var(--color-border-tertiary)', fontSize: 13 }}>
          <strong>Electrode pair E{selected.elec_a} – E{selected.elec_b}</strong>
          <div style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
            Resistivity: <strong>{selected.resistivity?.toFixed(2)} Ω·m</strong> ·
            Voltage: {selected.voltage?.toFixed(4)} V ·
            Current: {selected.current?.toFixed(4)} A ·
            Depth ≈ {selected.z?.toFixed(2)} m
          </div>
          <button onClick={() => setSelected(null)}
            style={{ marginTop: 8, fontSize: 12, padding: '2px 10px',
              background: 'none', border: '1px solid var(--color-border-secondary)',
              borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
            Close
          </button>
        </div>
      )}
    </div>
  );
}
