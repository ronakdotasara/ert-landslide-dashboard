// In dev: VITE_API_BASE is empty, so all calls go to /api/... (proxied by Vite to localhost:3001)
// In production: VITE_API_BASE=https://your-backend.railway.app
export const API_BASE = import.meta.env.VITE_API_BASE || '';

// WebSocket URL — wss:// in production, ws:// in dev
export const WS_URL = (() => {
  // Production: derive wss:// from the backend URL
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE.replace(/^https?/, (p) =>
      p === 'https' ? 'wss' : 'ws'
    ) + '/ws';
  }
  // Dev: connect directly to backend port — Vite proxies HTTP but WS proxy
  // is unreliable in some versions, so we talk to 3001 directly
  if (import.meta.env.DEV) {
    return 'ws://localhost:3001/ws';
  }
  // Production fallback (same host, e.g. behind nginx)
  return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`;
})();

console.log('[CONFIG] WS_URL =', WS_URL);