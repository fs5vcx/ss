const WebSocket = require('ws');

let wss = null;
const clients = new Set();

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection');
    clients.add(ws);

    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to cloud disk server',
      timestamp: Date.now()
    }));

    broadcast({
      type: 'system',
      message: 'A new user connected',
      onlineCount: clients.size,
      timestamp: Date.now()
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(ws, message);
      } catch (e) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: Date.now()
        }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket connection closed');
      clients.delete(ws);
      broadcast({
        type: 'system',
        message: 'A user disconnected',
        onlineCount: clients.size,
        timestamp: Date.now()
      });
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  return wss;
}

function handleMessage(ws, message) {
  switch (message.type) {
    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: Date.now()
      }));
      break;
    case 'file-upload-start':
      broadcast({
        type: 'file-upload-start',
        fileName: message.fileName,
        timestamp: Date.now()
      });
      break;
    default:
      ws.send(JSON.stringify({
        type: 'info',
        message: 'Unknown message type',
        receivedType: message.type,
        timestamp: Date.now()
      }));
  }
}

function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function notifyFileUploaded(fileInfo) {
  broadcast({
    type: 'file-uploaded',
    file: fileInfo,
    timestamp: Date.now()
  });
}

function notifyFileDeleted(fileName) {
  broadcast({
    type: 'file-deleted',
    fileName,
    timestamp: Date.now()
  });
}

function getOnlineCount() {
  return clients.size;
}

module.exports = {
  setupWebSocket,
  broadcast,
  notifyFileUploaded,
  notifyFileDeleted,
  getOnlineCount
};
