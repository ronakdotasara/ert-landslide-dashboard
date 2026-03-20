import { useEffect, useRef, useState } from 'react';
import { WS_URL } from '../config';

export function useWebSocket() {
  const [connected,   setConnected]   = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef    = useRef(null);
  const retryRef = useRef(null);

  function connect() {
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen  = () => { setConnected(true); };
    ws.onclose = () => {
      setConnected(false);
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
