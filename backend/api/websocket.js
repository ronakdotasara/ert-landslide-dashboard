const { WebSocketServer } = require('ws');

let wss = null;

function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    console.log('[WS] Client connected from', req.socket.remoteAddress);
    ws.send(JSON.stringify({ type: 'CONNECTED', ts: Date.now() }));

    ws.on('message', (msg) => {
      try {
        const data = JSON.parse(msg);
        console.log('[WS] Message from client:', data);
      } catch (_) {}
    });

    ws.on('close', () => console.log('[WS] Client disconnected'));
    ws.on('error', (err) => console.error('[WS] Error:', err.message));
  });

  console.log('[WS] WebSocket server ready at /ws');
}

function broadcast(payload) {
  if (!wss) return;
  const msg = JSON.stringify(payload);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(msg);
  });
}

module.exports = { initWebSocket, broadcast };
