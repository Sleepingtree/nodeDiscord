"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = void 0;
const tmi = __importStar(require("tmi.js"));
const gameService = __importStar(require("./gameService"));
const TWITCH_USER_NAME = process.env.TWITCH_USER_NAME;
const TWITCH_PASSWORD = process.env.TWITCH_PASSWORD;
const TWITCH_CHANNEL_NAME = (_a = process.env.TWITCH_CHANNEL_NAME) !== null && _a !== void 0 ? _a : "";
const botPrefix = '!';
// Define configuration options
const opts = {
    connection: {
        reconnect: true
    },
    identity: {
        username: TWITCH_USER_NAME,
        password: TWITCH_PASSWORD
    },
    channels: [
        TWITCH_CHANNEL_NAME
    ]
};
// Create a client with our options
const client = new tmi.client(opts);
// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);
// Connect to Twitch:
client.connect();
// Called every time a message comes in
function onMessageHandler(target, _context, msg, self) {
    if (self) {
        return;
    } // Ignore messages from the bot
    // Remove whitespace from chat message
    const commandName = msg.trim();
    if (!commandName.startsWith(botPrefix)) {
        return;
    }
    // If the command is known, let's execute it
    if (commandName === '!dice') {
        const num = rollDice();
        client.say(target, `You rolled a ${num}`);
        console.log(`* Executed ${commandName} command`);
    }
    else if (commandName.startsWith(botPrefix + 'teams')) {
        sendMessage(gameService.getTeamMessage());
    }
    else {
        console.log(`* Unknown command ${commandName}`);
    }
}
// Function called when the "dice" command is issued
function rollDice() {
    const sides = 6;
    return Math.floor(Math.random() * sides) + 1;
}
// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
    console.log(`* Connected to ${addr}:${port}`);
}
async function sendMessage(msg) {
    client.say(TWITCH_CHANNEL_NAME, msg);
}
exports.sendMessage = sendMessage;
//# sourceMappingURL=twitchService.js.map