#!/usr/bin/env node

/**
 * Module dependencies.
 */

import app from './app';
import debug from 'debug';
import https, { Server as HttpsServer } from 'https';
import { Server } from 'http';
import fs from 'fs';
import { Server as SocketServer, Socket } from 'socket.io';
import bot, { botStatusEmitter } from '../services/discordLogIn';
import BotStatus from '../model/botStatus';
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

let server: Server | HttpsServer;

if (devlopment) {
  server = app.listen(port);
} else {
  const privateKey = fs.readFileSync('server.key', 'utf8');
  const certificate = fs.readFileSync('server.cert', 'utf8');
  server = https.createServer({
    key: privateKey,
    cert: certificate
  }, app).listen(port);
}


/**
 * Listen on provided port, on all network interfaces.
 */

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

  function handleStatusUpdate(status: BotStatus | undefined) {
    socket.emit('botStatus', status);
  }

  handleStatusUpdate(getBotStatus());

  botStatusEmitter.on('botStatusChange', handleStatusUpdate);

  socket.on('disconnect', () => {
    botStatusEmitter.off('botStatusChange', handleStatusUpdate);
  });
});

function handleCloseEvent(serverType: string, error?: Error) {
  if (error) {
    console.error(`Unexpected error on shutdown of ${serverType} server, Error: ${error}`)
  } else {
    console.log(`closed ${serverType} server`);
  }
}

const handleShutdowns = () => {
  server.close(error => {
    handleCloseEvent('http(s)', error);
  });
  io.close(error => {
    handleCloseEvent('socket', error);
  });
  bot.destroy();
  console.log('waiting 10 secounds for requests to close');
  setInterval(() => {
    console.log('process exit')
    process.exit();
  }, 10000);
}

process.on('SIGTERM', handleShutdowns);