import { useEffect, useRef, useState } from 'react';

const WS_URL = `ws://${window.location.host}/ws`;

export function useWebSocket() {
  const [connected,    setConnected]    = useState(false);
  const [lastMessage,  setLastMessage]  = useState(null);
  const wsRef = useRef(null);
  const retryRef = useRef(null);

  function connect() {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen  = () => { setConnected(true); console.log('[WS] Connected'); };
    ws.onclose = () => {
      setConnected(false);
      console.log('[WS] Disconnected. Retrying in 3s…');
      retryRef.current = setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
    ws.onmessage = (e) => {
      try { setLastMessage(JSON.parse(e.data)); } catch (_) {}
    };
  }

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { connected, lastMessage };
}
