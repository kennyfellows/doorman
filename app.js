const express = require('express');
const ws      = require('ws');
const fs      = require('fs');
const path    = require('path');
const uuid    = require('uuid');
const jwt     = require('jsonwebtoken');

const SECRET = uuid.v4();
const app    = express();

const wsServer = new ws.Server({ noServer: true, clientTracking: false });

const jwtWhitelist = {};

let queue      = [];

app.get( '/', ( req, res ) => {
  const filePath = path.join( __dirname, 'public/index.html' );
  res.sendFile( filePath );
});

app.get( '/store', verifyJWT, ( req, res ) => {
  const filePath = path.join( __dirname, 'public/store.html' );
  res.sendFile( filePath );
});

app.get( '/doorman/:num', ( req, res ) => {
  grantAccess( req.params.num );
});

wsServer.on( 'connection', socket => {
  queue.push( socket );
  socket.on( 'close', () => {
    removeFromQueue( socket );
  });
  sendLinePlace( socket, queue.length - 1 );
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

function grantAccess( numClients ) {
  const grantedClients = queue.splice( 0, numClients );

  grantedClients.forEach( client => {
    const exp   = Math.floor( Date.now() / 1000 ) + ( 60 * 10 );
    const token = jwt.sign({ exp }, SECRET )
    const msg   = createMessage( 'access-granted', { jwt: token });

    jwtWhitelist[ token ] = true;
    client.send( msg );
  });
}

function removeFromQueue( closedSocket ) {
  queue = queue.filter( client => {
    return client !== closedSocket;
  });

  queue.forEach( sendLinePlace );
}

function createMessage( type, payload ) {
  return JSON.stringify({
    type,
    payload
  })
}

async function verifyJWT( req, res, next ) {

  try {

    const token = req.query.jwt;

    if ( !jwtWhitelist[ token ] ) {
      throw new Error();
    }

    const verified = await jwt.verify( token, SECRET );
    const payload  = await jwt.decode( token );

    delete jwtWhitelist[ token ];

    next();

  } catch ( e ) {

    return res.status( 401 ).send('Unauthorized');

  }

}

setInterval( () => {
  grantAccess( 1 );
}, 30000 );
