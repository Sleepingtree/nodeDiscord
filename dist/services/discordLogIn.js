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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.postMessageInChannel = exports.updateBotStatus = exports.getBotStatus = exports.whoIs = exports.whosOnline = exports.getChannelNameFromId = exports.BOT_PREFIX = exports.botStatusEmitter = void 0;
const discord_js_1 = __importStar(require("discord.js"));
const fs_1 = __importDefault(require("fs"));
const botStatusEmitter_1 = __importDefault(require("../model/botStatusEmitter"));
const throwIfUndefinedOrNull_1 = __importDefault(require("../util/throwIfUndefinedOrNull"));
const bot = new discord_js_1.default.Client({
    intents: [
        discord_js_1.Intents.FLAGS.GUILDS,
        discord_js_1.Intents.FLAGS.GUILD_MEMBERS,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGES,
        discord_js_1.Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        discord_js_1.Intents.FLAGS.GUILD_PRESENCES,
        discord_js_1.Intents.FLAGS.GUILD_INTEGRATIONS,
        discord_js_1.Intents.FLAGS.GUILD_VOICE_STATES,
        discord_js_1.Intents.FLAGS.DIRECT_MESSAGES,
        discord_js_1.Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
    partials: ["CHANNEL"]
});
exports.botStatusEmitter = new botStatusEmitter_1.default();
const deletedMessageFile = 'deletedMessageFile.json';
const TOKEN = process.env.DISCORD_BOT_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
const THE_FOREST_ID = (_a = process.env.THE_FOREST_ID) !== null && _a !== void 0 ? _a : (0, throwIfUndefinedOrNull_1.default)('Discord server ID is undefined');
const WHISS_USER_ID = process.env.WHISS_USER_ID;
exports.BOT_PREFIX = '!';
const commands = [exports.BOT_PREFIX + 'startGame', exports.BOT_PREFIX + 'cancelGame', exports.BOT_PREFIX + 'redWins', exports.BOT_PREFIX + 'blueWins',
    exports.BOT_PREFIX + 'mmr', exports.BOT_PREFIX + 'map', exports.BOT_PREFIX + 'join', exports.BOT_PREFIX + 'roles', exports.BOT_PREFIX + 'okite'];
bot.login(TOKEN);
bot.on('ready', () => {
    var _a;
    console.info(`Logged in as ${(_a = bot.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
});
bot.on('messageCreate', msg => {
    if (msg.content === 'ping') {
        console.log('ping');
        msg.reply('pong');
        msg.channel.send('pong');
    }
    else if (msg.content.startsWith(exports.BOT_PREFIX + 'whoIs')) {
        whoIs(msg);
    }
    else if (msg.content.startsWith(exports.BOT_PREFIX + 'help')) {
        let message = 'use the following commands or ask Tree for help: \r\n\r\n';
        commands.forEach(command => message += command + '\r\n');
        msg.channel.send(message);
    }
});
bot.on('messageDelete', async (message) => {
    var _a;
    console.log('in delete');
    const file = await fs_1.default.promises.readFile(deletedMessageFile, 'utf8');
    const jsonFile = JSON.parse(file);
    jsonFile[message.id] = message;
    const fileString = JSON.stringify(jsonFile, null, 2);
    const reply = `Message from ${(_a = message.member) === null || _a === void 0 ? void 0 : _a.user.username} was deleted message was: \`${message.content}\` `;
    if (WHISS_USER_ID) {
        const whiss = await bot.users.fetch(WHISS_USER_ID);
        whiss.send(reply);
        fs_1.default.promises.writeFile(deletedMessageFile, fileString);
    }
});
async function getChannelNameFromId(channelId) {
    return await bot.channels.fetch(channelId)
        .then(channel => channel.name)
        .catch(console.log);
}
exports.getChannelNameFromId = getChannelNameFromId;
async function whosOnline(channelId) {
    let usersOnline = [];
    const theForrest = await bot.guilds.fetch(THE_FOREST_ID);
    const channels = await theForrest.channels.fetch();
    channels
        .filter(channel => typeof channelId === 'undefined' || channel.id === channelId)
        .forEach(channel => {
        if (channel.isVoice()) {
            channel.members.forEach(member => usersOnline.push(member.user.username));
        }
    });
    return usersOnline;
}
exports.whosOnline = whosOnline;
function whoIs(msg) {
    if (msg.author.id == TREE_USER_ID) {
        const id = msg.content.split(" ")[1];
        const userPromise = bot.users.fetch(id);
        userPromise.then(user => {
            if (user != null) {
                msg.channel.send(user.username);
            }
            else {
                msg.channel.send("誰もいない");
            }
        });
    }
}
exports.whoIs = whoIs;
function getBotStatus(botStatus) {
    const botUser = bot.user;
    if (!botUser) {
        return undefined;
    }
    else {
        const activity = botStatus ? botStatus.activities[0] : botUser.presence.activities[0];
        if (activity) {
            if (activity.type === 'CUSTOM') {
                return {
                    message: `${botUser.username}'s status is: ${activity.name}`,
                    avatarURL: `${botUser.avatarURL()}`
                };
            }
            else {
                return {
                    message: `${botUser.username} is ${activity.type.toLowerCase()} ${addedWordToBotStatus(activity.type)}${activity.name}`,
                    avatarURL: `${botUser.avatarURL()}`
                };
            }
        }
        else {
            return {
                message: `${botUser.username} is not doing anything`,
                avatarURL: `${botUser.avatarURL()}`
            };
        }
    }
}
exports.getBotStatus = getBotStatus;
function addedWordToBotStatus(activityType) {
    switch (activityType) {
        case 'LISTENING':
            return 'to ';
        case 'COMPETING':
            return 'in ';
        default:
            return ' ';
    }
}
function treeDisplayType(activityType) {
    switch (activityType) {
        case 'CUSTOM':
            return '';
        default:
            return activityType.toLocaleLowerCase().replace('ing', '');
    }
}
function updateBotStatus(status, options) {
    var _a, _b;
    let botStatus;
    if (status) {
        console.log(`Updating bot status to  ${status}`);
    }
    if (status) {
        botStatus = (_a = bot.user) === null || _a === void 0 ? void 0 : _a.setActivity(status, options);
    }
    else {
        botStatus = (_b = bot.user) === null || _b === void 0 ? void 0 : _b.setActivity();
    }
    if (botStatus) {
        exports.botStatusEmitter.emit('botStatusChange', getBotStatus(botStatus));
    }
}
exports.updateBotStatus = updateBotStatus;
async function postMessageInChannel(message, channelName) {
    const theForest = await bot.guilds.fetch(THE_FOREST_ID);
    const channel = theForest.channels.cache
        .filter(channel => channel.name.replace('-', ' ').toLowerCase() === channelName)
        .first();
    if (channel === null || channel === void 0 ? void 0 : channel.isText()) {
        channel.send(message);
    }
}
exports.postMessageInChannel = postMessageInChannel;
bot.on('presenceUpdate', (oldSatus, newStatus) => {
    var _a, _b;
    //Check if the user is me, and if there is a real staus change
    if (((_a = newStatus.member) === null || _a === void 0 ? void 0 : _a.id) === TREE_USER_ID && newStatus.activities !== (oldSatus === null || oldSatus === void 0 ? void 0 : oldSatus.activities)) {
        const botStatus = (_b = bot.user) === null || _b === void 0 ? void 0 : _b.presence.activities[0];
        if (!botStatus || botStatus.type === 'WATCHING') {
            const treeStatus = newStatus.activities[0];
            if (treeStatus) {
                let statusMessage = `Tree ${treeDisplayType(treeStatus.type)}${addedWordToBotStatus(treeStatus.type)}`;
                if (treeStatus.details) {
                    statusMessage += `${treeStatus.details}`;
                }
                else if (treeStatus.state) {
                    statusMessage += `${treeStatus.state}`;
                }
                else {
                    statusMessage += `${treeStatus.name}`;
                }
                updateBotStatus(statusMessage, { type: 'WATCHING' });
            }
            else {
                updateBotStatus();
            }
        }
    }
});
exports.default = bot;
//# sourceMappingURL=discordLogIn.js.map