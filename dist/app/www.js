#!/usr/bin/env node
"use strict";
/**
 * Module dependencies.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const debug_1 = __importDefault(require("debug"));
const https_1 = __importDefault(require("https"));
const http_1 = __importDefault(require("http"));
const fs_1 = __importDefault(require("fs"));
const socket_io_1 = require("socket.io");
const discordLogIn_1 = require("../services/discordLogIn");
const discordLogIn_2 = require("../services/discordLogIn");
/**
 * Get port from environment and store in Express.
 */
const devlopment = process.env.DEVELOPMENT ? process.env.DEVELOPMENT == 'true' : false;
const port = normalizePort(process.env.PORT || '3000');
app_1.default.set('port', port);
/**
 * Create HTTP server.
 */
let server;
if (devlopment) {
    server = http_1.default.createServer(app_1.default);
}
else {
    const privateKey = fs_1.default.readFileSync('server.key', 'utf8');
    const certificate = fs_1.default.readFileSync('server.cert', 'utf8');
    const caCert = fs_1.default.readFileSync('root.pem', 'utf8');
    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: caCert
    };
    server = https_1.default.createServer(credentials, app_1.default);
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
function normalizePort(val) {
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
function onError(error) {
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
        : 'port ' + (addr === null || addr === void 0 ? void 0 : addr.port);
    debug_1.default('Listening on ' + bind);
}
const io = new socket_io_1.Server(server, { path: '/io' });
io.on("connection", (socket) => {
    //TODO replace with events instead of pushing.
    socket.emit('botStatus', discordLogIn_2.getBotStatus());
    discordLogIn_1.botStatusEmitter.on(discordLogIn_1.botStatusChangeEvent, () => {
        socket.emit('botStatus', discordLogIn_2.getBotStatus());
    });
});
//# sourceMappingURL=www.js.map