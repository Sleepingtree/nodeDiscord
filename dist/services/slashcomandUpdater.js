"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const promises_1 = __importDefault(require("fs/promises"));
const throwIfUndefinedOrNull_1 = __importDefault(require("../util/throwIfUndefinedOrNull"));
const TOKEN = (_a = process.env.DISCORD_BOT_KEY) !== null && _a !== void 0 ? _a : (0, throwIfUndefinedOrNull_1.default)('bot token was undefined');
const APPLICATION_ID = (_b = process.env.DISCORD_APPLICATION_ID) !== null && _b !== void 0 ? _b : (0, throwIfUndefinedOrNull_1.default)('discord application id is undeifed');
(async () => {
    const commandFiles = (await promises_1.default.readdir('./dist/discordCommands')).filter(file => file.endsWith('.js'));
    const discordCommands = [];
    commandFiles.forEach(file => {
        const fileCommands = require(`../discordCommands/${file}`).default;
        fileCommands.commands.forEach((item) => discordCommands.push(item.slashCommand.toJSON()));
    });
    const result = await (0, node_fetch_1.default)(`https://discord.com/api/v9/applications/${APPLICATION_ID}/commands`, {
        headers: {
            "Authorization": `Bot ${TOKEN}`
        },
        body: discordCommands,
        method: 'POST'
    });
    console.log(result);
})();
//# sourceMappingURL=slashcomandUpdater.js.map