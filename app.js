const express = require('express');
const ws      = require('ws');

const app      = express();
const wsServer = new ws.Server({ noServer: true });

wsServer.on( 'connection', socket => {
  socket.on( 'message', console.log );
});

const server = app.listen( 3000 );

server.on( 'upgrade', ( req, socket, head ) => {
  wsServer.handleUpgrade( req, socket, head, ws => {
    wsServer.emit( 'connection', ws, req );
  });
});
