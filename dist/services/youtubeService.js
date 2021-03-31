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
let voiceConnection;
let voiceStream;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const playQueue = [];
const service = googleapis_1.google.youtube({
    version: 'v3',
    auth: GOOGLE_API_KEY
});
discordLogIn_1.default.on('message', msg => {
    if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'play ')) {
        searchAndAddYoutube(msg, msg.content.split(discordLogIn_1.BOT_PREFIX + 'play ')[1]);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'play')) {
        resume(msg);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'skip')) {
        checkAndIncrmentQueue(msg);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'remove ')) {
        removeItemFromQueue(msg, msg.content.split(discordLogIn_1.BOT_PREFIX + 'remove ')[1]);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'queue')) {
        listQueue(msg);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'pause')) {
        puase();
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'clearQueue')) {
        closeVoiceConnection();
    }
});
async function playYoutube(msg, url, songName) {
    var _a;
    const tempConnection = await getConnection(msg);
    (_a = discordLogIn_1.default.user) === null || _a === void 0 ? void 0 : _a.setActivity(songName, { type: "LISTENING" });
    voiceStream = tempConnection.play(ytdl_core_1.default(url, { quality: 'highestaudio' }), { volume: 0.1 })
        .on("finish", () => checkAndIncrmentQueue(msg))
        .on("error", closeVoiceConnection);
}
async function getConnection(msg) {
    if (voiceConnection) {
        return voiceConnection;
    }
    if (msg.member) {
        const channel = msg.member.voice.channel;
        if (!channel) {
            msg.channel.send('you must be in a voice channel!');
        }
        else {
            const tempConnection = await channel.join();
            voiceConnection = tempConnection;
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
            }
        }
        msg.channel.send('You need to search on something!');
    }
    catch (error) {
        console.error(error);
    }
    console.error('Shouldn\'t be here');
}
async function searchAndAddYoutube(msg, search) {
    const queueItem = await searchYoutube(msg, search);
    const isQueueEmpty = playQueue.length == 0;
    if (queueItem) {
        playQueue.push(queueItem);
        if (isQueueEmpty) {
            playYoutube(msg, queueItem.url, queueItem.title);
        }
    }
}
function checkAndIncrmentQueue(msg) {
    playQueue.shift();
    if (playQueue.length > 0) {
        playYoutube(msg, playQueue[0].url, playQueue[0].title);
    }
    else {
        closeVoiceConnection();
    }
}
function closeVoiceConnection(error) {
    var _a;
    if (voiceConnection) {
        voiceConnection.disconnect();
    }
    if (error) {
        console.error(error);
    }
    playQueue.splice(0, playQueue.length);
    (_a = discordLogIn_1.default.user) === null || _a === void 0 ? void 0 : _a.setActivity();
    voiceConnection = undefined;
    voiceStream = undefined;
}
function listQueue(msg) {
    let response = `no songs in the queue, use ${discordLogIn_1.BOT_PREFIX}play to add songs`;
    if (playQueue.length > 0) {
        response = 'Songs in queue: ```';
        for (let index = 0; index < playQueue.length; index++) {
            const item = playQueue[index];
            response += `${index}) ${item.title} \r\n\r\n`;
        }
        response += '```';
    }
    msg.channel.send(response);
}
function puase() {
    if (voiceStream) {
        voiceStream.pause();
    }
}
function resume(msg) {
    if (voiceStream) {
        voiceStream.resume();
    }
    else {
        msg.channel.send('Nothing is in the queue');
    }
}
function removeItemFromQueue(msg, itemToRemove) {
    const numberItemToRemove = Number(itemToRemove);
    if (Number.isNaN(numberItemToRemove)) {
        msg.channel.send(`the message '${discordLogIn_1.BOT_PREFIX}remove ' must be followed by the number of a song in queue`);
    }
    else if (playQueue[numberItemToRemove]) {
        if (numberItemToRemove == 0) {
            checkAndIncrmentQueue(msg);
        }
        else {
            const removedItems = playQueue.splice(numberItemToRemove, 1);
            msg.channel.send(`removed: ${removedItems[0].title}`);
            if (playQueue.length == 0) {
                closeVoiceConnection();
            }
        }
    }
    else {
        msg.channel.send(`${itemToRemove} is not a spot in the queue`);
    }
}
//# sourceMappingURL=youtubeService.js.map