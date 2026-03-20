import { useState } from 'react';

const DEVICE = 'ERT-001';

export function useDeviceControl() {
  const [loading,      setLoading]      = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [commandLog,   setCommandLog]   = useState([]);

  async function sendCommand(command) {
    if (!command) return;
    setLoading(true);
    try {
      const res = await fetch('/api/control', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ device_id: DEVICE, command }),
      });
      const data = await res.json();
      setLastResponse(data.ok ? `OK: ${command}` : `Error: ${data.error}`);
      setCommandLog(prev => [...prev, { command, ts: Date.now(), ok: data.ok }]);
    } catch (e) {
      setLastResponse(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return { sendCommand, loading, lastResponse, commandLog };
}
