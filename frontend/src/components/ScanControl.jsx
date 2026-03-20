import { useState } from 'react';
import { useDeviceControl } from '../hooks/useDeviceControl';

export default function ScanControl() {
  const { sendCommand, loading } = useDeviceControl();
  const [scanState, setScanState] = useState('idle'); // idle | running | manual

  async function handleStart() {
    await sendCommand('START');
    setScanState('running');
  }
  async function handleStop() {
    await sendCommand('STOP');
    setScanState('idle');
  }
  async function handleManual() {
    await sendCommand('MANUAL');
    setScanState('manual');
  }

  const stateColor = { idle: '#888780', running: '#1D9E75', manual: '#7F77DD' }[scanState];

  return (
    <div>
      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: stateColor,
          boxShadow: scanState === 'running' ? `0 0 6px ${stateColor}` : 'none' }} />
        <span style={{ fontSize: 13, textTransform: 'capitalize', color: 'var(--color-text-secondary)' }}>
          {scanState === 'running' ? 'Auto scanning…' : scanState === 'manual' ? 'Manual mode' : 'Idle'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button onClick={handleStart} disabled={loading || scanState === 'running'}
          style={{ padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: scanState === 'running' ? 'var(--color-border-tertiary)' : '#1D9E75',
            color: '#fff', border: 'none', cursor: scanState === 'running' ? 'default' : 'pointer' }}>
          ▶ Start Auto Scan
        </button>
        <button onClick={handleStop} disabled={loading || scanState === 'idle'}
          style={{ padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: scanState !== 'idle' ? '#E24B4A' : 'var(--color-border-tertiary)',
            color: '#fff', border: 'none', cursor: scanState !== 'idle' ? 'pointer' : 'default' }}>
          ■ Stop
        </button>
        <button onClick={handleManual} disabled={loading}
          style={{ padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: scanState === 'manual' ? '#7F77DD' : 'var(--color-background-secondary)',
            color: scanState === 'manual' ? '#fff' : 'var(--color-text-primary)',
            border: '1px solid var(--color-border-secondary)', cursor: 'pointer' }}>
          Manual Mode
        </button>
      </div>
    </div>
  );
}
