const bcrypt = require('bcrypt');

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

const connections = {};

io.on('connection', (socket) => {
  if (Object.keys(connections).length >= 2) {
    socket.emit('connectionLimit');
    socket.disconnect(true);
    return;
  }

  socket.on('encrypt', (data) => {
    if (Object.keys(connections).length === 2) {
      for (const key in connections) {
        if (connections[key] !== socket) {
          const encryptedData = encryptData(data);
          connections[key].emit('decrypt', encryptedData);
        }
      }
    }
  });

  connections[socket.id] = socket;

  socket.on('disconnect', () => {
    delete connections[socket.id];
  });
});


io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    const salt = bcrypt.genSalt(10);
    const enc = bcrypt.hashSync(msg,parseInt(salt));
    console.log('message: ' + enc);
    io.emit('chat message', msg);
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
