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
Object.defineProperty(exports, "__esModule", { value: true });
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const discordLogIn_1 = __importStar(require("./discordLogIn"));
const googleapis_1 = require("googleapis");
const voiceConnectionMap = {};
const voiceStreamMap = {};
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const playQueue = {};
const service = googleapis_1.google.youtube({
    version: 'v3',
    auth: GOOGLE_API_KEY
});
discordLogIn_1.default.on('message', msg => {
    if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'play ')) {
        handleNotInGuild(msg, (guildId) => searchAndAddYoutube(guildId, msg, msg.content.split(discordLogIn_1.BOT_PREFIX + 'play ')[1]));
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'play')) {
        handleNotInGuild(msg, (guildId) => resume(guildId, msg));
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'skip')) {
        handleNotInGuild(msg, (guildId) => checkAndIncrmentQueue(guildId, msg));
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'remove ')) {
        handleNotInGuild(msg, (guildId) => removeItemFromQueue(guildId, msg, msg.content.split(discordLogIn_1.BOT_PREFIX + 'remove ')[1]));
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'queue')) {
        handleNotInGuild(msg, (guildId) => listQueue(guildId, msg));
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'pause')) {
        handleNotInGuild(msg, (guildId) => puase(guildId));
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'clearQueue')) {
        handleNotInGuild(msg, (guildId) => closeVoiceConnection(guildId));
    }
});
function handleNotInGuild(msg, cb) {
    var _a;
    if (!((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id)) {
        msg.channel.send('You must send messages in a server channel');
    }
    else {
        cb(msg.guild.id);
    }
}
async function playYoutube(url, songName, guildId, msg) {
    const tempConnection = await getConnection(guildId, msg);
    voiceStreamMap[guildId] = tempConnection.play((0, ytdl_core_1.default)(url, { quality: 'highestaudio', filter: (video) => video.hasAudio }), { volume: 0.1 })
        .on("finish", () => checkAndIncrmentQueue(guildId, msg))
        .on("error", (error) => {
        checkAndIncrmentQueue(guildId);
        console.error(error);
    });
    (0, discordLogIn_1.updateBotStatus)(songName, { type: "LISTENING" });
}
async function getConnection(guildId, msg) {
    const existingConnection = voiceConnectionMap[guildId];
    if (existingConnection) {
        return existingConnection;
    }
    if (msg === null || msg === void 0 ? void 0 : msg.member) {
        const channel = msg.member.voice.channel;
        if (!channel) {
            closeVoiceConnection(guildId);
            msg.channel.send('you must be in a voice channel!');
        }
        else {
            if (channel.guild.id !== guildId) {
                msg.channel.send('You need to be in one server for this to work!');
            }
            const tempConnection = await channel.join();
            voiceConnectionMap[guildId] = tempConnection;
            return tempConnection;
        }
    }
    //If connection was not gotten throw caller needs to handle it
    throw `Either member was not in a channel or was unable to get a voice connection`;
}
async function searchYoutube(msg, search) {
    var _a, _b;
    console.log(search);
    try {
        if (search) {
            const searchResults = await service.search.list({
                q: search,
                part: ['snippet'],
                maxResults: 1
            });
            if (searchResults.data.items && ((_a = searchResults.data.items[0].id) === null || _a === void 0 ? void 0 : _a.videoId)) {
                const innerSearch = await service.videos.list({
                    id: [searchResults.data.items[0].id.videoId],
                    part: ['snippet']
                });
                if (innerSearch.data.items && ((_b = innerSearch.data.items[0].snippet) === null || _b === void 0 ? void 0 : _b.title)) {
                    const title = innerSearch.data.items[0].snippet.title;
                    msg.channel.send(`added: ${title}`);
                    return {
                        url: `https://www.youtube.com/watch?v=${searchResults.data.items[0].id.videoId}`,
                        title: title
                    };
                }
                else {
                    console.error(`Inner search items ${typeof innerSearch.data.items}`);
                }
            }
            else {
                console.error(`Search results status was ${searchResults.status} data ${searchResults.data.items}`);
            }
        }
        else {
            msg.channel.send('You need to search on something!');
        }
    }
    catch (error) {
        console.error(error);
    }
}
async function searchAndAddYoutube(guildId, msg, search) {
    var _a;
    const queueItem = await searchYoutube(msg, search);
    const localQueue = (_a = playQueue[guildId]) !== null && _a !== void 0 ? _a : [];
    if (queueItem) {
        localQueue.push(queueItem);
        playQueue[guildId] = localQueue;
        if (localQueue.length === 1) {
            playYoutube(queueItem.url, queueItem.title, guildId, msg);
        }
    }
}
function checkAndIncrmentQueue(guildId, msg) {
    const localQueue = playQueue[guildId];
    if (localQueue) {
        localQueue.shift();
        playQueue[guildId] = localQueue;
        if (localQueue.length > 0) {
            playYoutube(localQueue[0].url, localQueue[0].title, guildId, msg);
        }
        else {
            closeVoiceConnection(guildId);
        }
    }
}
function closeVoiceConnection(guildId, error) {
    let localVoicConnection = voiceConnectionMap[guildId];
    if (localVoicConnection) {
        localVoicConnection.disconnect();
    }
    if (error) {
        console.error(error);
    }
    playQueue[guildId] = [];
    (0, discordLogIn_1.updateBotStatus)();
    voiceConnectionMap[guildId] = undefined;
    voiceStreamMap[guildId] = undefined;
}
function listQueue(guildId, msg) {
    var _a;
    let response = `no songs in the queue, use ${discordLogIn_1.BOT_PREFIX}play to add songs`;
    const localPlayQueue = (_a = playQueue[guildId]) !== null && _a !== void 0 ? _a : [];
    if (localPlayQueue.length > 0) {
        response = 'Songs in queue: ```';
        for (let index = 0; index < localPlayQueue.length; index++) {
            const item = localPlayQueue[index];
            response += `${index}) ${item.title} \r\n\r\n`;
        }
        response += '```';
    }
    msg.channel.send(response);
}
function puase(guildId) {
    const localVoiceStream = voiceStreamMap[guildId];
    if (localVoiceStream) {
        localVoiceStream.pause();
    }
}
function resume(guildId, msg) {
    const localVoiceStream = voiceStreamMap[guildId];
    if (localVoiceStream) {
        localVoiceStream.resume();
    }
    else {
        msg.channel.send('Nothing is in the queue');
    }
}
function removeItemFromQueue(guildId, msg, itemToRemove) {
    var _a;
    const numberItemToRemove = Number(itemToRemove);
    const localPlayQueue = (_a = playQueue[guildId]) !== null && _a !== void 0 ? _a : [];
    if (Number.isNaN(numberItemToRemove)) {
        msg.channel.send(`the message '${discordLogIn_1.BOT_PREFIX}remove ' must be followed by the number of a song in queue`);
    }
    else if (localPlayQueue[numberItemToRemove]) {
        if (numberItemToRemove == 0) {
            checkAndIncrmentQueue(guildId, msg);
        }
        else {
            const removedItems = localPlayQueue.splice(numberItemToRemove, 1);
            msg.channel.send(`removed: ${removedItems[0].title}`);
            if (localPlayQueue.length == 0) {
                closeVoiceConnection(guildId);
            }
            else {
                playQueue[guildId] = localPlayQueue;
            }
        }
    }
    else {
        msg.channel.send(`${itemToRemove} is not a spot in the queue`);
    }
}
//# sourceMappingURL=youtubeService.js.map