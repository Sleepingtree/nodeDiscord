"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const promises_1 = __importDefault(require("fs/promises"));
const throwIfUndefinedOrNull_1 = __importDefault(require("../util/throwIfUndefinedOrNull"));
const discordLogIn_1 = __importDefault(require("./discordLogIn"));
const TOKEN = (_a = process.env.DISCORD_BOT_KEY) !== null && _a !== void 0 ? _a : (0, throwIfUndefinedOrNull_1.default)('bot token was undefined');
const APPLICATION_ID = (_b = process.env.DISCORD_APPLICATION_ID) !== null && _b !== void 0 ? _b : (0, throwIfUndefinedOrNull_1.default)('discord application id is undeifed');
(async () => {
    const commandFiles = (await promises_1.default.readdir('./dist/discordCommands')).filter(file => file.endsWith('.js'));
    const commandMap = new Map();
    const buttonCommandMap = new Map();
    commandFiles.forEach(file => {
        var _a;
        const fileCommands = require(`../discordCommands/${file}`).default;
        fileCommands.commands.forEach(async (item) => {
            commandMap.set(item.slashCommand.name, item.cb);
            if (item.needsUpdate) {
                const result = await (0, node_fetch_1.default)(`https://discord.com/api/v9/applications/${APPLICATION_ID}/commands`, {
                    headers: {
                        "Authorization": `Bot ${TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(item.slashCommand),
                    method: 'POST'
                });
                const reponseBody = await result.json();
                if (!result.ok) {
                    console.error(reponseBody);
                    console.error(reponseBody.errors);
                }
                else {
                    console.log(reponseBody);
                    console.log(`Updated bot response`);
                }
            }
        });
        (_a = fileCommands.buttonCommands) === null || _a === void 0 ? void 0 : _a.forEach(command => {
            buttonCommandMap.set(command.name, command.cb);
        });
    });
    discordLogIn_1.default.on('interactionCreate', (interaction) => {
        if (interaction.isCommand()) {
            const cb = commandMap.get(interaction.commandName);
            if (cb) {
                console.log(`calling command ${interaction.commandName}`);
                cb(interaction);
            }
            else {
                console.error('no command cb function defined!');
            }
        }
        else if (interaction.isButton()) {
            const cb = buttonCommandMap.get(interaction.customId);
            if (cb) {
                console.log(`calling button command ${interaction.customId}`);
                cb(interaction);
            }
            else {
                console.error('no button cb function defined!');
            }
        }
        else {
            console.warn('interaction, but not command or button');
        }
    });
})();
//# sourceMappingURL=slashcomandUpdater.js.map