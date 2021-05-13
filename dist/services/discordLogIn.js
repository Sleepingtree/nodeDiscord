"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBotStatus = exports.getBotStatus = exports.whoIs = exports.whosOnline = exports.getChannelNameFromId = exports.BOT_PREFIX = exports.botStatusEmitter = void 0;
const discord_js_1 = __importDefault(require("discord.js"));
const fs_1 = __importDefault(require("fs"));
const botStatusEmitter_1 = __importDefault(require("../model/botStatusEmitter"));
const bot = new discord_js_1.default.Client();
exports.botStatusEmitter = new botStatusEmitter_1.default();
const deletedMessageFile = 'deletedMessageFile.json';
const TOKEN = process.env.DISCORD_BOT_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
const WHISS_USER_ID = process.env.WHISS_USER_ID;
exports.BOT_PREFIX = '!';
const commands = [exports.BOT_PREFIX + 'startGame', exports.BOT_PREFIX + 'cancelGame', exports.BOT_PREFIX + 'redWins', exports.BOT_PREFIX + 'blueWins',
    exports.BOT_PREFIX + 'mmr', exports.BOT_PREFIX + 'map', exports.BOT_PREFIX + 'join', exports.BOT_PREFIX + 'roles', exports.BOT_PREFIX + 'okite'];
bot.login(TOKEN);
bot.on('ready', () => {
    var _a;
    console.info(`Logged in as ${(_a = bot.user) === null || _a === void 0 ? void 0 : _a.tag}!`);
});
bot.on('message', msg => {
    if (msg.content === 'ping') {
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
bot.on('messageDelete', message => {
    var _a;
    console.log('in delete');
    const file = fs_1.default.readFileSync(deletedMessageFile, 'utf8');
    const jsonFile = JSON.parse(file);
    jsonFile[message.id] = message;
    const fileString = JSON.stringify(jsonFile, null, 2);
    const reply = `Message from ${(_a = message.member) === null || _a === void 0 ? void 0 : _a.user.username} was deleted message was: \`${message.content}\` `;
    if (WHISS_USER_ID) {
        bot.users.fetch(WHISS_USER_ID)
            .then(user => user.send(reply))
            .catch(console.log);
        fs_1.default.writeFileSync(deletedMessageFile, fileString);
    }
});
async function getChannelNameFromId(channelId) {
    return await bot.channels.fetch(channelId)
        .then(channel => channel.name)
        .catch(console.log);
}
exports.getChannelNameFromId = getChannelNameFromId;
async function whosOnline(channelId) {
    if (!channelId) {
        throw 'channel id is null';
    }
    let usersOnline = new Array();
    await bot.channels.fetch(channelId)
        .then(channel => {
        const guildChannel = channel;
        if (channel != null && guildChannel.members != null) {
            guildChannel.members
                .each(member => bot.users.fetch(member.id)
                .then(user => {
                usersOnline.push(user.username);
            }));
        }
    })
        .catch(err => {
        console.log(err);
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
            if (activity.type === 'CUSTOM_STATUS') {
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
        case 'CUSTOM_STATUS':
            return '';
        default:
            return activityType.toLocaleLowerCase().replace('ing', '');
    }
}
async function updateBotStatus(status, options) {
    var _a, _b;
    let botStatus;
    if (status) {
        botStatus = await ((_a = bot.user) === null || _a === void 0 ? void 0 : _a.setActivity(status, options));
    }
    else {
        botStatus = await ((_b = bot.user) === null || _b === void 0 ? void 0 : _b.setActivity(options));
    }
    if (botStatus) {
        exports.botStatusEmitter.emit('botStatusChange', getBotStatus(botStatus));
    }
}
exports.updateBotStatus = updateBotStatus;
bot.on('presenceUpdate', (oldSatus, newStatus) => {
    var _a;
    //Check if the user is me, and if there is a real staus change
    if (newStatus.userID === TREE_USER_ID && newStatus.activities !== (oldSatus === null || oldSatus === void 0 ? void 0 : oldSatus.activities)) {
        const botStatus = (_a = bot.user) === null || _a === void 0 ? void 0 : _a.presence.activities[0];
        if (!botStatus || botStatus.type === 'WATCHING') {
            const treeStatus = newStatus.activities[0];
            if (treeStatus) {
                let statusMessage = `Tree ${treeDisplayType(treeStatus.type)} ${addedWordToBotStatus(treeStatus.type)}`;
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