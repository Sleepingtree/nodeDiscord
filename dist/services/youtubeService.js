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
    if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'okite')) {
        playYoutube(msg, 'https://www.youtube.com/watch?v=6QBw0FVlPiI');
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'shitPost')) {
        playYoutube(msg, 'https://www.youtube.com/watch?v=fLaNJLZK21Y');
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'play ')) {
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
function playYoutube(msg, url) {
    return __awaiter(this, void 0, void 0, function* () {
        if (voiceConnection === null) {
            yield getConnection(msg);
        }
        voiceStream = voiceConnection.play(ytdl_core_1.default(url, { quality: 'highestaudio' }), { volume: 0.1 })
            .on("finish", () => checkAndIncrmentQueue(msg))
            .on("error", closeVoiceConnection);
    });
}
function getConnection(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        if (msg.member) {
            const channel = msg.member.voice.channel;
            if (!channel) {
                msg.channel.send('you must be in a voice channel!');
            }
            else {
                voiceConnection = yield channel.join();
            }
        }
    });
}
function searchYoutube(msg, search) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        console.log(search);
        try {
            if (search) {
                const searchResults = yield service.search.list({
                    q: search,
                    part: ['snippet'],
                    maxResults: 1
                });
                if (searchResults.data.items && ((_a = searchResults.data.items[0].id) === null || _a === void 0 ? void 0 : _a.videoId)) {
                    const innerSearch = yield service.videos.list({
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
    });
}
function searchAndAddYoutube(msg, search) {
    return __awaiter(this, void 0, void 0, function* () {
        const queueItem = yield searchYoutube(msg, search);
        const isQueueEmpty = playQueue.length == 0;
        if (queueItem) {
            playQueue.push(queueItem);
            if (isQueueEmpty) {
                playYoutube(msg, queueItem.url);
            }
        }
    });
}
function checkAndIncrmentQueue(msg) {
    playQueue.shift();
    if (playQueue.length > 0) {
        playYoutube(msg, playQueue[0].url);
    }
    else {
        closeVoiceConnection();
    }
}
function closeVoiceConnection(error) {
    if (voiceConnection.status) {
        voiceConnection.disconnect();
        voiceStream.end();
        playQueue.splice(0, playQueue.length);
    }
    if (error) {
        console.error(error);
    }
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
    if (voiceConnection != null) {
        voiceStream.pause();
    }
}
function resume(msg) {
    if (voiceStream != null) {
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