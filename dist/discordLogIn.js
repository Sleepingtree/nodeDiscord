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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whosOnline = exports.getChannelNameFromId = void 0;
const discord_js_1 = __importDefault(require("discord.js"));
const fs_1 = __importDefault(require("fs"));
const bot = new discord_js_1.default.Client();
const gameServices = __importStar(require("./gameService"));
const clashService = __importStar(require("./clashPlaningService"));
const draftService = __importStar(require("./draftService"));
const discordRoleService = __importStar(require("./discordRoleService"));
const waniKaniService = __importStar(require("./waniKaniService"));
const alexaService = __importStar(require("./alexaService"));
const youtubeService = __importStar(require("./youtubeService"));
const deletedMessageFile = 'deletedMessageFile.json';
const checkUserInterval = 1000 * 60 * 5;
const checkWaniKaniInterval = 1000 * 60;
const TOKEN = process.env.DISCORD_BOT_KEY;
const THE_FOREST_ID = process.env.THE_FOREST_ID;
const WHISS_USER_ID = process.env.WHISS_USER_ID;
const BOT_PREFIX = '!';
const commands = [BOT_PREFIX + 'startGame', BOT_PREFIX + 'cancelGame', BOT_PREFIX + 'redWins', BOT_PREFIX + 'blueWins',
    BOT_PREFIX + 'mmr', BOT_PREFIX + 'map', BOT_PREFIX + 'join', BOT_PREFIX + 'roles', BOT_PREFIX + 'okite'];
bot.login(TOKEN);
bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
});
bot.on('message', msg => {
    if (msg.content === 'ping') {
        msg.reply('pong');
        msg.channel.send('pong');
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'startGame')) {
        gameServices.startGame(bot, msg);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'gameStart')) {
        msg.channel.send("It's " + BOT_PREFIX + 'startGame ... バカ...');
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'cancelGame')) {
        gameServices.endGame(bot, msg);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'redWins')) {
        gameServices.endGame(bot, msg, true);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'blueWins')) {
        gameServices.endGame(bot, msg, false);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'mmr')) {
        gameServices.checkMmr(bot, msg);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'map')) {
        gameServices.pickMap(msg);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'whoIs')) {
        gameServices.whoIs(bot, msg);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'draft')) {
        draftService.createDraftPost(bot, msg);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'clashMessage')) {
        clashService.addClashTime(bot, msg);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'roles')) {
        const joinCommand = BOT_PREFIX + 'join -';
        discordRoleService.listRoles(bot, msg, joinCommand);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'join')) {
        discordRoleService.joinRole(bot, msg);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'wani')) {
        waniKaniService.sendReviewcount(bot);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'okite')) {
        youtubeService.playYoutube(bot, 'https://www.youtube.com/watch?v=6QBw0FVlPiI');
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'shitPost')) {
        youtubeService.playYoutube(bot, 'https://www.youtube.com/watch?v=fLaNJLZK21Y');
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'help')) {
        let message = 'use the following commands or ask Tree for help: \r\n\r\n';
        commands.forEach(command => message += command + '\r\n');
        msg.channel.send(message);
    }
    else if (msg.content.startsWith(BOT_PREFIX + 'kick')) {
        if (msg.mentions.users.size) {
            const taggedUser = msg.mentions.users.first();
            msg.channel.send(`You wanted to kick: ${taggedUser.username}`);
        }
        else {
            msg.reply('Please tag a valid user!');
        }
    }
});
bot.on('voiceStateUpdate', (oldState, newState) => {
    setTimeout(() => checkIfSateIsSame(newState), 1000 * 60 * 5);
});
bot.on('messageDelete', message => {
    console.log('in delete');
    let file = fs_1.default.readFileSync(deletedMessageFile, 'utf8');
    let jsonFile = JSON.parse(file);
    jsonFile[message.id] = message;
    const fileString = JSON.stringify(jsonFile, null, 2);
    const reply = `Message from ${message.member.user.username} was deleted message was: \`${message.content}\` `;
    bot.users.fetch(WHISS_USER_ID)
        .then(user => user.send(reply))
        .catch(console.log);
    fs_1.default.writeFileSync(deletedMessageFile, fileString);
});
function checkIfSateIsSame(oldState) {
    if (oldState != null && oldState.guild != null && oldState.guild.id == THE_FOREST_ID) {
        bot.channels.fetch(oldState.channelID)
            .then(channel => {
            if (channel.members.has(oldState.member.id)) {
                alexaService.checkToSendWhosOnline(oldState.channelID);
            }
        }).catch(console.log);
    }
}
function getChannelNameFromId(channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bot.channels.fetch(channelId)
            .then(channel => channel.name)
            .catch(console.log);
    });
}
exports.getChannelNameFromId = getChannelNameFromId;
function whosOnline(channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        let usersOnline = new Array();
        yield bot.channels.fetch(channelId)
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
    });
}
exports.whosOnline = whosOnline;
setInterval(() => waniKaniService.checkReviewCount(bot), checkWaniKaniInterval);
setInterval(() => discordRoleService.checkUsersInDisc(bot), checkUserInterval);
//# sourceMappingURL=discordLogIn.js.map