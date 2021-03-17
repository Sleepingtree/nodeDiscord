"use strict";
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
exports.whoIs = exports.whosOnline = exports.getChannelNameFromId = exports.BOT_PREFIX = void 0;
const discord_js_1 = __importDefault(require("discord.js"));
const fs_1 = __importDefault(require("fs"));
const bot = new discord_js_1.default.Client();
const deletedMessageFile = 'deletedMessageFile.json';
const TOKEN = process.env.DISCORD_BOT_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
const WHISS_USER_ID = process.env.WHISS_USER_ID;
exports.BOT_PREFIX = '!';
const commands = [exports.BOT_PREFIX + 'startGame', exports.BOT_PREFIX + 'cancelGame', exports.BOT_PREFIX + 'redWins', exports.BOT_PREFIX + 'blueWins',
    exports.BOT_PREFIX + 'mmr', exports.BOT_PREFIX + 'map', exports.BOT_PREFIX + 'join', exports.BOT_PREFIX + 'roles', exports.BOT_PREFIX + 'okite'];
bot.login(TOKEN);
bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
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
    else if (msg.content.startsWith(exports.BOT_PREFIX + 'kick')) {
        if (msg.mentions.users.size) {
            const taggedUser = msg.mentions.users.first();
            msg.channel.send(`You wanted to kick: ${taggedUser.username}`);
        }
        else {
            msg.reply('Please tag a valid user!');
        }
    }
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
exports.default = bot;
//# sourceMappingURL=discordLogIn.js.map