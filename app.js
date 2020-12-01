const express  = require('express');
const ws       = require('ws');
const fs       = require('fs');
const path     = require('path');

const app      = express();
const wsServer = new ws.Server({ noServer: true });

const queue    = new Map();

app.get( '/', ( req, res ) => {
  const filePath = path.join( __dirname, 'index.html' );
  res.sendFile( filePath );
});

wsServer.on( 'connection', socket => {
  const placeInLine = wsServer.clients.size - 1;
  queue.set( socket, placeInLine );

  socket.on( 'close', () => {
    sendPlaceUpdate( socket, wsServer );
  });

  sendLinePlace( socket, placeInLine );
});

const server = app.listen( 3000 );

server.on( 'upgrade', ( req, socket, head ) => {
  wsServer.handleUpgrade( req, socket, head, ws => {
    wsServer.emit( 'connection', ws, req );
  });
});

function sendLinePlace( socket, place ) {
  const msg = createMessage( 'line-update', { place } );
  socket.send( msg );
}

function sendPlaceUpdate( closedSocket, server ) {
  const closedPlace = queue.get( closedSocket );

  server.clients.forEach( client => {
    const place = queue.get( client );

    if ( place > closedPlace ) {
      const newPlace = place - 1;
      queue.set( client, newPlace );
      sendLinePlace( client, newPlace );
    }

    queue.delete( closedSocket );
  });
}

function createMessage( type, payload ) {
  return JSON.stringify({
    type,
    payload
  })
}
