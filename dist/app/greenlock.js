"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const socket_io_1 = require("socket.io");
const discordLogIn_1 = require("../services/discordLogIn");
const discordLogIn_2 = require("../services/discordLogIn");
/**
 * this file is for let's encrile
 */
require("greenlock-express")
    .init({
    packageRoot: __dirname,
    configDir: "./greenlock.d",
    // contact for security and critical bug notices
    maintainerEmail: "ajgrabow@gmail.com",
    // whether or not to run at cloudscale
    cluster: false
})
    // Serves on 80 and 443
    // Get's SSL certificates magically!
    .serve(httpsWorker);
function httpsWorker(server) {
    const io = new socket_io_1.Server(server.httpsServer(), {
        path: '/io',
        cors: {
            origin: 'https://sleepingtree.net'
        }
    });
    io.on("connection", (socket) => {
        function handleStatusUpdate(status) {
            socket.emit('botStatus', status);
        }
        handleStatusUpdate((0, discordLogIn_2.getBotStatus)());
        discordLogIn_1.botStatusEmitter.on('botStatusChange', handleStatusUpdate);
        socket.on('disconnect', () => {
            discordLogIn_1.botStatusEmitter.off('botStatusChange', handleStatusUpdate);
        });
    });
    function handleCloseEvent(serverType, error) {
        if (error) {
            console.error(`Unexpected error on shutdown of ${serverType} server, Error: ${error}`);
        }
        else {
            console.log(`closed ${serverType} server`);
        }
    }
    process.on('SIGTERM', () => {
        server.httpsServer().close(error => {
            handleCloseEvent('http(s)', error);
        });
        io.close(error => {
            handleCloseEvent('socket', error);
        });
        console.log('waiting 10 secounds for requests to close');
        setInterval(() => {
            console.log('process exit');
            process.exit();
        }, 10000);
    });
    return app_1.default;
}
//# sourceMappingURL=greenlock.js.map