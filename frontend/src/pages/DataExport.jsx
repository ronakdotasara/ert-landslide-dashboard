import { useState } from 'react';

export default function DataExport() {
  const [format,    setFormat]    = useState('csv');
  const [from,      setFrom]      = useState('');
  const [to,        setTo]        = useState('');
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams({ device: 'ERT-001', limit: 10000, format });
      if (from) params.set('from', new Date(from).getTime());
      if (to)   params.set('to',   new Date(to).getTime());

      const res  = await fetch(`/api/readings?${params}`);
      const data = await res.json();
      const rows = data.readings || [];

      let content, mime, ext;
      if (format === 'csv') {
        const header = 'id,device_id,timestamp_ms,elec_a,elec_b,voltage,current,resistivity';
        const lines  = rows.map(r =>
          `${r.id},${r.device_id},${r.timestamp_ms},${r.elec_a},${r.elec_b},${r.voltage},${r.current},${r.resistivity}`
        );
        content = [header, ...lines].join('\n');
        mime = 'text/csv'; ext = 'csv';
      } else {
        content = JSON.stringify(rows, null, 2);
        mime = 'application/json'; ext = 'json';
      }

      const blob = new Blob([content], { type: mime });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `ert_readings_${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 600 }}>
      <h1 style={{ marginBottom: 8 }}>Data Export</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Download raw resistivity readings for offline processing, archival, or import into Res2DInv.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18,
        padding: '20px 24px', background: 'var(--color-background-secondary)',
        borderRadius: 10, border: '1px solid var(--color-border-tertiary)' }}>

        <label style={{ fontSize: 13 }}>
          Format
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {['csv', 'json'].map(f => (
              <button key={f} onClick={() => setFormat(f)}
                style={{ padding: '6px 20px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  background: format === f ? '#378ADD' : 'var(--color-background-primary)',
                  color: format === f ? '#fff' : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border-secondary)', fontWeight: format === f ? 500 : 400 }}>
                .{f.toUpperCase()}
              </button>
            ))}
          </div>
        </label>

        <label style={{ fontSize: 13 }}>
          Date range (optional)
          <div style={{ display: 'flex', gap: 10, marginTop: 6, alignItems: 'center' }}>
            <input type="datetime-local" value={from} onChange={e => setFrom(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, fontSize: 13,
                background: 'var(--color-background-primary)',
                border: '1px solid var(--color-border-secondary)',
                color: 'var(--color-text-primary)' }} />
            <span style={{ color: 'var(--color-text-tertiary)' }}>to</span>
            <input type="datetime-local" value={to} onChange={e => setTo(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: 8, fontSize: 13,
                background: 'var(--color-background-primary)',
                border: '1px solid var(--color-border-secondary)',
                color: 'var(--color-text-primary)' }} />
          </div>
        </label>

        <button onClick={handleExport} disabled={exporting}
          style={{ padding: '10px 0', borderRadius: 8, fontSize: 14, fontWeight: 500,
            background: exporting ? 'var(--color-border-secondary)' : '#378ADD',
            color: '#fff', border: 'none', cursor: exporting ? 'not-allowed' : 'pointer' }}>
          {exporting ? 'Preparing download…' : `Download .${format.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
