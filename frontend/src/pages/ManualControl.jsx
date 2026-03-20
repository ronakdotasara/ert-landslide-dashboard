import { useState } from 'react';
import { useDeviceControl } from '../hooks/useDeviceControl';

const QUICK_COMMANDS = [
  { label: 'Start Auto Scan', cmd: 'START',  color: '#1D9E75', desc: 'Begin automatic scanning every 30s' },
  { label: 'Stop Scan',       cmd: 'STOP',   color: '#E24B4A', desc: 'Halt all scanning immediately' },
  { label: 'Manual Mode',     cmd: 'MANUAL', color: '#7F77DD', desc: 'Take control of electrode selection' },
  { label: 'Auto Mode',       cmd: 'AUTO',   color: '#378ADD', desc: 'Return to automatic scanning' },
  { label: 'Device Status',   cmd: 'STATUS', color: '#BA7517', desc: 'Request status report from ESP' },
];

export default function ManualControl() {
  const { sendCommand, loading, lastResponse, commandLog } = useDeviceControl();
  const [pairA, setPairA] = useState(0);
  const [pairB, setPairB] = useState(1);
  const [customCmd, setCustomCmd] = useState('');

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <h1 style={{ marginBottom: 8 }}>Manual Control</h1>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: 14, marginBottom: 28 }}>
        Send commands directly to the ESP device. Use with caution during active monitoring.
      </p>

      {/* Quick command buttons */}
      <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Quick Commands</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
        {QUICK_COMMANDS.map(({ label, cmd, color, desc }) => (
          <button key={cmd}
            onClick={() => sendCommand(cmd)}
            disabled={loading}
            title={desc}
            style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
              background: color, color: '#fff', border: 'none', fontWeight: 500,
              opacity: loading ? 0.6 : 1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Manual pair measurement */}
      <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Measure Specific Pair</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28,
        padding: '16px 20px', background: 'var(--color-background-secondary)',
        borderRadius: 10, border: '1px solid var(--color-border-tertiary)' }}>
        <label style={{ fontSize: 13 }}>
          Electrode A
          <select value={pairA} onChange={e => setPairA(Number(e.target.value))}
            style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6, fontSize: 13,
              background: 'var(--color-background-primary)',
              border: '1px solid var(--color-border-secondary)', color: 'var(--color-text-primary)' }}>
            {Array.from({ length: 32 }, (_, i) => (
              <option key={i} value={i}>E{i}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 13 }}>
          Electrode B
          <select value={pairB} onChange={e => setPairB(Number(e.target.value))}
            style={{ marginLeft: 8, padding: '4px 8px', borderRadius: 6, fontSize: 13,
              background: 'var(--color-background-primary)',
              border: '1px solid var(--color-border-secondary)', color: 'var(--color-text-primary)' }}>
            {Array.from({ length: 32 }, (_, i) => (
              <option key={i} value={i}>E{i}</option>
            ))}
          </select>
        </label>
        <button onClick={() => sendCommand(`PAIR ${pairA} ${pairB}`)}
          disabled={loading || pairA === pairB}
          style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13,
            background: pairA !== pairB ? '#378ADD' : 'var(--color-background-secondary)',
            color: pairA !== pairB ? '#fff' : 'var(--color-text-tertiary)',
            border: '1px solid var(--color-border-secondary)', cursor: 'pointer' }}>
          Measure Pair
        </button>
      </div>

      {/* Custom command input */}
      <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>Custom Command</h3>
      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input
          value={customCmd}
          onChange={e => setCustomCmd(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && sendCommand(customCmd)}
          placeholder="e.g. STATUS or PAIR 0 15"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, fontSize: 13,
            background: 'var(--color-background-secondary)',
            border: '1px solid var(--color-border-secondary)',
            color: 'var(--color-text-primary)' }} />
        <button onClick={() => sendCommand(customCmd)} disabled={!customCmd || loading}
          style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13,
            background: customCmd ? '#378ADD' : 'var(--color-background-secondary)',
            color: customCmd ? '#fff' : 'var(--color-text-tertiary)',
            border: '1px solid var(--color-border-secondary)', cursor: 'pointer' }}>
          Send
        </button>
      </div>

      {/* Response / log */}
      {lastResponse && (
        <div style={{ padding: '10px 14px', background: 'var(--color-background-secondary)',
          borderRadius: 8, fontFamily: 'monospace', fontSize: 12,
          border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)',
          marginBottom: 16 }}>
          Response: {lastResponse}
        </div>
      )}

      <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>Command Log</h3>
      <div style={{ maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: 12,
        background: 'var(--color-background-secondary)', borderRadius: 8,
        border: '1px solid var(--color-border-tertiary)', padding: '8px 12px' }}>
        {commandLog.length === 0 && <div style={{ color: 'var(--color-text-tertiary)' }}>No commands sent yet.</div>}
        {[...commandLog].reverse().map((entry, i) => (
          <div key={i} style={{ padding: '2px 0', color: 'var(--color-text-secondary)' }}>
            <span style={{ color: 'var(--color-text-tertiary)' }}>
              {new Date(entry.ts).toLocaleTimeString()}
            </span>
            {' '}&gt; {entry.command}
          </div>
        ))}
      </div>
    </div>
  );
}
