import { Server } from 'ws';
import app from './app';
import { Server as SocketServer, Socket } from 'socket.io';
import { botStatusEmitter } from '../services/discordLogIn';
import BotStatus from '../model/botStatus';
import { getBotStatus } from '../services/discordLogIn';
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


function httpsWorker(server: { httpsServer: () => Server, }) {
    const io = new SocketServer(server.httpsServer(), {
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

    process.on('SIGTERM', () => {
        server.httpsServer().close(error => {
            handleCloseEvent('http(s)', error);
        });
        io.close(error => {
            handleCloseEvent('socket', error);
        })
        console.log('waiting 10 secounds for requests to close')
        setInterval(() => {
            console.log('process exit')
            process.exit();
        }, 10000)
    });
    return app;
}