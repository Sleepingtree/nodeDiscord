"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const events_1 = __importDefault(require("events"));
class DiscordBot extends events_1.default {
    constructor() {
        super();
        this.GAME_NAME = null;
        this.options = {
            messageCacheMaxSize: 64
        };
        this.users = new discord_js_1.UserManager(new discord_js_1.Client());
    }
    on(event, listener) {
        console.log('in here');
        return this;
    }
}
const bot = new DiscordBot();
exports.default = bot;
//# sourceMappingURL=discordLogIn.js.map