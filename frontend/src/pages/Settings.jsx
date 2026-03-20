import { useState } from 'react';

export default function Settings() {
  const [deviceId,  setDeviceId]  = useState('ERT-001');
  const [serverUrl, setServerUrl] = useState('http://192.168.1.100:3001');
  const [interval,  setInterval]  = useState(30);
  const [saved,     setSaved]     = useState(false);

  function save() {
    localStorage.setItem('ert_settings', JSON.stringify({ deviceId, serverUrl, interval }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <h1 style={{ marginBottom: 24 }}>Settings</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20,
        padding: '20px 24px', background: 'var(--color-background-secondary)',
        borderRadius: 10, border: '1px solid var(--color-border-tertiary)' }}>

        {[
          { label: 'Device ID', value: deviceId, set: setDeviceId, type: 'text', hint: 'Must match DEVICE_ID in firmware config.h' },
          { label: 'Backend Server URL', value: serverUrl, set: setServerUrl, type: 'url', hint: 'IP:port of Node.js backend' },
          { label: 'Auto-scan interval (seconds)', value: interval, set: v => setInterval(Number(v)), type: 'number', hint: 'How often ESP runs a full electrode scan' },
        ].map(({ label, value, set, type, hint }) => (
          <label key={label} style={{ fontSize: 13 }}>
            {label}
            <input type={type} value={value} onChange={e => set(e.target.value)}
              style={{ display: 'block', marginTop: 4, width: '100%', padding: '7px 10px',
                borderRadius: 8, fontSize: 13,
                background: 'var(--color-background-primary)',
                border: '1px solid var(--color-border-secondary)',
                color: 'var(--color-text-primary)' }} />
            <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2, display: 'block' }}>
              {hint}
            </span>
          </label>
        ))}

        <button onClick={save}
          style={{ padding: '9px 0', borderRadius: 8, fontSize: 14, fontWeight: 500,
            background: saved ? '#1D9E75' : '#378ADD', color: '#fff',
            border: 'none', cursor: 'pointer', marginTop: 4 }}>
          {saved ? '✓ Settings Saved' : 'Save Settings'}
        </button>
      </div>

      <div style={{ marginTop: 28, padding: '16px 20px',
        background: 'var(--color-background-secondary)', borderRadius: 10,
        border: '1px solid var(--color-border-tertiary)', fontSize: 13 }}>
        <h3 style={{ fontWeight: 500, marginBottom: 10 }}>About</h3>
        <div style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
          <div>ERT Landslide Monitoring Dashboard</div>
          <div>Arduino Mega 2560 + ADG2188 + 32 electrodes</div>
          <div>Budget: ₹11,360 · Himachal Pradesh field deployment</div>
        </div>
      </div>
    </div>
  );
}
