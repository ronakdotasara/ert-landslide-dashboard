// In dev: VITE_API_BASE is empty, so all calls go to /api/... (proxied by Vite to localhost:3001)
// In production: VITE_API_BASE=https://your-backend.railway.app
export const API_BASE = import.meta.env.VITE_API_BASE || '';

// WebSocket URL — wss:// in production, ws:// in dev
export const WS_URL = (() => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE.replace(/^https?/, (p) =>
      p === 'https' ? 'wss' : 'ws'
    ) + '/ws';
  }
  return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
})();
