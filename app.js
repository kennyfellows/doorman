const express  = require('express');
const ws       = require('ws');
const fs       = require('fs');
const path     = require('path');

const app      = express();
const wsServer = new ws.Server({ noServer: true });

app.get( '/', ( req, res ) => {
  const filePath = path.join( __dirname, 'index.html' );
  res.sendFile( filePath );
});

wsServer.on( 'connection', socket => {
  socket.on( 'message', console.log );
});

const server = app.listen( 3000 );

server.on( 'upgrade', ( req, socket, head ) => {
  wsServer.handleUpgrade( req, socket, head, ws => {
    wsServer.emit( 'connection', ws, req );
  });
});
