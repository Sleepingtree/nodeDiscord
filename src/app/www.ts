#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from './app';
import debug from 'debug';
import https from 'https';
import http, { Server } from 'http';
import fs from 'fs';
import {Server as SocketServer, Socket} from 'socket.io';
import { botStatusChangeEvent, botStatusEmitter } from '../services/discordLogIn';

import { getBotStatus } from '../services/discordLogIn';

/**
 * Get port from environment and store in Express.
 */

const devlopment = process.env.DEVELOPMENT ? process.env.DEVELOPMENT == 'true' : false;



const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

let server: Server;

if(devlopment){
  server = http.createServer(app);
}else{
  const privateKey  = fs.readFileSync('server.key', 'utf8');
  const certificate = fs.readFileSync('server.cert', 'utf8');
  const caCert = fs.readFileSync('root.pem', 'utf8');

  const credentials = {
    key: privateKey, 
    cert: certificate,
    ca: caCert
  };
  
  server = https.createServer(credentials, app);
}


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: Error) {
  console.error(error);
  throw error;
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  let addr = server.address();
  let bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr?.port;
  debug('Listening on ' + bind);
}

const io = new SocketServer(server, {
  path: '/io',
  cors: {
    origin: 'https://sleepingtree.net'
  }
});

io.on("connection", (socket: Socket) => {

  function handleStatusUpdate(){
    socket.emit('botStatus', getBotStatus());
  }
  
  handleStatusUpdate();

  botStatusEmitter.on(botStatusChangeEvent, handleStatusUpdate);

  socket.on('disconnect', () =>{
    botStatusEmitter.off(botStatusChangeEvent, handleStatusUpdate);
  });
});

function handleCloseEvent(serverType: string, error?: Error){
  if(error){
    console.error(`Unexpected error on shutdown of ${serverType} server, Error: ${error}`)
  }else{
    console.log(`closed ${serverType} server`);
  }
}

process.on('SIGTERM', ()=>{
  server.close(error =>{
    handleCloseEvent('http(s)', error);
  });
  io.close(error =>{
    handleCloseEvent('socket', error);
  })
});