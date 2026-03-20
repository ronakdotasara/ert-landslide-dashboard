export default function ResistivityTable({ readings = [] }) {
  if (readings.length === 0) {
    return <div style={{ padding: '24px 0', textAlign: 'center',
      color: 'var(--color-text-tertiary)', fontSize: 13 }}>No readings yet.</div>;
  }

  const cols = ['Timestamp', 'E–A', 'E–B', 'Voltage (V)', 'Current (A)', 'Resistivity (Ω·m)'];

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border-secondary)' }}>
            {cols.map(c => (
              <th key={c} style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 500,
                color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {readings.map((r, i) => (
            <tr key={r.id ?? i}
              style={{ borderBottom: '1px solid var(--color-border-tertiary)',
                background: i % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
              <td style={{ padding: '5px 12px', color: 'var(--color-text-tertiary)' }}>
                {new Date(r.timestamp_ms).toLocaleTimeString()}
              </td>
              <td style={{ padding: '5px 12px', fontFamily: 'monospace' }}>E{r.elec_a}</td>
              <td style={{ padding: '5px 12px', fontFamily: 'monospace' }}>E{r.elec_b}</td>
              <td style={{ padding: '5px 12px', fontFamily: 'monospace' }}>{r.voltage?.toFixed(5)}</td>
              <td style={{ padding: '5px 12px', fontFamily: 'monospace' }}>{r.current?.toFixed(5)}</td>
              <td style={{ padding: '5px 12px', fontFamily: 'monospace', fontWeight: 500,
                color: r.resistivity < 50 ? '#2166ac' : r.resistivity > 3000 ? '#d6604d' : 'var(--color-text-primary)' }}>
                {r.resistivity?.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
