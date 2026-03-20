import { useEffect, useState } from 'react';
import { useAlertStore } from '../store/alertStore';

const SEVERITY_COLOR = {
  HIGH:   { bg: '#FCEBEB', text: '#A32D2D', border: '#F7C1C1' },
  MEDIUM: { bg: '#FAEEDA', text: '#854F0B', border: '#FAC775' },
  LOW:    { bg: '#EAF3DE', text: '#3B6D11', border: '#C0DD97' },
};

export default function AlertsLog() {
  const { alerts, markRead, markAllRead, fetchAlerts } = useAlertStore();
  const [lowThreshold,  setLowThreshold]  = useState(10);
  const [highThreshold, setHighThreshold] = useState(5000);
  const [saved, setSaved]                 = useState(false);

  useEffect(() => { fetchAlerts(); }, []);

  async function saveThresholds() {
    await fetch('/api/alerts/thresholds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: 'ERT-001', low_threshold: lowThreshold, high_threshold: highThreshold }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Alerts & Anomalies</h1>
        <button onClick={markAllRead}
          style={{ fontSize: 13, padding: '6px 14px', borderRadius: 8,
            background: 'none', border: '1px solid var(--color-border-secondary)',
            cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
          Mark all read
        </button>
      </div>

      {/* Threshold config */}
      <div style={{ padding: '16px 20px', background: 'var(--color-background-secondary)',
        borderRadius: 10, border: '1px solid var(--color-border-tertiary)', marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Alert Thresholds (Ω·m)</h3>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13 }}>
            Low (moisture alert below)
            <input type="number" value={lowThreshold} onChange={e => setLowThreshold(Number(e.target.value))}
              style={{ display: 'block', marginTop: 4, padding: '6px 10px', borderRadius: 8, width: 100,
                background: 'var(--color-background-primary)',
                border: '1px solid var(--color-border-secondary)',
                color: 'var(--color-text-primary)', fontSize: 13 }} />
          </label>
          <label style={{ fontSize: 13 }}>
            High (void alert above)
            <input type="number" value={highThreshold} onChange={e => setHighThreshold(Number(e.target.value))}
              style={{ display: 'block', marginTop: 4, padding: '6px 10px', borderRadius: 8, width: 100,
                background: 'var(--color-background-primary)',
                border: '1px solid var(--color-border-secondary)',
                color: 'var(--color-text-primary)', fontSize: 13 }} />
          </label>
          <button onClick={saveThresholds}
            style={{ padding: '7px 18px', borderRadius: 8, fontSize: 13,
              background: saved ? '#1D9E75' : '#378ADD', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {saved ? '✓ Saved' : 'Save Thresholds'}
          </button>
        </div>
      </div>

      {/* Alerts list */}
      {alerts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--color-text-tertiary)',
          padding: '48px 0', fontSize: 14 }}>
          No alerts. System operating normally.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {alerts.map((alert) => {
            const sev = alert.severity || (alert.type === 'LOW_RESISTIVITY' ? 'HIGH' : 'MEDIUM');
            const col = SEVERITY_COLOR[sev] || SEVERITY_COLOR.LOW;
            return (
              <div key={alert.id}
                style={{ padding: '12px 16px', borderRadius: 10,
                  background: alert.read ? 'var(--color-background-secondary)' : col.bg,
                  border: `1px solid ${alert.read ? 'var(--color-border-tertiary)' : col.border}`,
                  display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%',
                  background: alert.read ? 'var(--color-border-secondary)' : col.text, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500,
                    color: alert.read ? 'var(--color-text-secondary)' : col.text }}>
                    {alert.type?.replace('_', ' ')} — E{alert.elec_a}–E{alert.elec_b}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                    {alert.value?.toFixed(2)} Ω·m ·{' '}
                    {new Date(alert.timestamp_ms).toLocaleString()}
                  </div>
                </div>
                {!alert.read && (
                  <button onClick={() => markRead(alert.id)}
                    style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6,
                      background: 'none', border: `1px solid ${col.border}`,
                      color: col.text, cursor: 'pointer' }}>
                    Dismiss
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
