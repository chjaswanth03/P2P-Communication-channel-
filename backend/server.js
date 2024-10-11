const express = require('express');
const WebSocket = require('ws');

const app = express();
const port = 8080;

// Set up WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Broadcast to all connected clients
wss.broadcast = (data) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

wss.on('connection', ws => {
  console.log('New client connected');

  ws.on('message', message => {
    console.log(`Received: ${message}`);
    wss.broadcast(`Broadcast: ${message}`);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
