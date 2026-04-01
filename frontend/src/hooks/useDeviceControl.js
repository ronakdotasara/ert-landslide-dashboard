import { useState } from 'react';
import { API_BASE } from '../config';

const DEVICE = 'ERT-001';

export function useDeviceControl() {
  const [loading,      setLoading]      = useState(false);
  const [lastResponse, setLastResponse] = useState(null);
  const [commandLog,   setCommandLog]   = useState([]);

  async function sendCommand(command) {
    if (!command) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/control`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ device_id: DEVICE, command }),
      });

      if (!res.ok) { // Check if the response status is not in the 2xx range
        const errorText = await res.text(); // Read as text in case it's not JSON
        throw new Error(`Server responded with status ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      setLastResponse(data.ok ? `OK: ${command}` : `Error: ${data.error}`);
      setCommandLog(prev => [...prev, { command, ts: Date.now(), ok: data.ok }]);
    } catch (e) {
      setLastResponse(`Network or server error: ${e.message}`); // Updated message
      console.error("Error sending command:", e); // Log the full error
    } finally {
      setLoading(false);
    }
  }

  return { sendCommand, loading, lastResponse, commandLog };
}
