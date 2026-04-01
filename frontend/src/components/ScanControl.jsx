import { useState } from 'react';
import { useDeviceControl } from '../hooks/useDeviceControl';

export default function ScanControl({ disabled = false }) {
  const { sendCommand, loading } = useDeviceControl();
  const [scanState, setScanState] = useState('idle'); // idle | running | manual

  async function handleStart() {
    await sendCommand('START_SCAN');   // ← matches ESP32 firmware
    setScanState('running');
  }
  async function handleStop() {
    await sendCommand('STOP_SCAN');    // ← matches ESP32 firmware
    setScanState('idle');
  }
  async function handleManual() {
    await sendCommand('SINGLE_SCAN'); // ← triggers one scan immediately
    setScanState('manual');
    // Auto-reset to idle after single scan completes (~30s max)
    setTimeout(() => setScanState('idle'), 35000);
  }

  const stateColor = { idle: '#888780', running: '#1D9E75', manual: '#7F77DD' }[scanState];

  return (
    <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      {disabled && (
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
          Scan control disabled in demo mode.
        </p>
      )}

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%', background: stateColor,
          boxShadow: scanState === 'running' ? `0 0 6px ${stateColor}` : 'none'
        }} />
        <span style={{ fontSize: 13, textTransform: 'capitalize', color: 'var(--color-text-secondary)' }}>
          {scanState === 'running' ? 'Auto scanning every 30 s…'
            : scanState === 'manual' ? 'Single scan running…'
            : 'Idle'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleStart}
          disabled={loading || scanState === 'running'}
          style={{
            padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: scanState === 'running' ? 'var(--color-border-tertiary)' : '#1D9E75',
            color: '#fff', border: 'none',
            cursor: scanState === 'running' ? 'default' : 'pointer',
          }}>
          ▶ Start Auto Scan
        </button>

        <button
          onClick={handleStop}
          disabled={loading || scanState === 'idle'}
          style={{
            padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: scanState !== 'idle' ? '#E24B4A' : 'var(--color-border-tertiary)',
            color: '#fff', border: 'none',
            cursor: scanState !== 'idle' ? 'pointer' : 'default',
          }}>
          ■ Stop
        </button>

        <button
          onClick={handleManual}
          disabled={loading}
          style={{
            padding: '9px 0', borderRadius: 8, fontSize: 13, fontWeight: 500,
            background: scanState === 'manual' ? '#7F77DD' : 'var(--color-background-secondary)',
            color: scanState === 'manual' ? '#fff' : 'var(--color-text-primary)',
            border: '1px solid var(--color-border-secondary)', cursor: 'pointer',
          }}>
          ⚡ Single Scan Now
        </button>
      </div>
    </div>
  );
}