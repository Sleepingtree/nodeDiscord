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
let voiceConnection = null;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const playQueue = [];
let isPlaying = false;
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
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'skip')) {
        checkAndIncrmentQueue(msg);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'queue')) {
        listQueue(msg);
    }
});
function playYoutube(msg, url) {
    return __awaiter(this, void 0, void 0, function* () {
        if (voiceConnection === null) {
            yield getConnection(msg);
        }
        voiceConnection.play(ytdl_core_1.default(url, { quality: 'highestaudio' }), { volume: 0.1 })
            .on("finish", () => checkAndIncrmentQueue(msg))
            .on("error", closeVoiceConnection);
    });
}
function getConnection(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const channel = msg.member.voice.channel;
        if (!channel) {
            msg.channel.send('you must be in a voice channel!');
        }
        else {
            voiceConnection = yield channel.join();
        }
    });
}
function searchYoutube(msg, search) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(search);
        try {
            if (search) {
                const searchResults = yield service.search.list({
                    q: search,
                    part: ['snippet']
                });
                const title = yield service.videos.list({
                    id: [searchResults.data.items[0].id.videoId],
                    part: ['snippet']
                }).then(item => item.data.items[0].snippet.title);
                return {
                    url: `https://www.youtube.com/watch?v=${searchResults.data.items[0].id.videoId}`,
                    title: title
                };
            }
            msg.channel.send('You need to search on something!');
        }
        catch (error) {
            console.error(error);
        }
        return null;
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
    if (voiceConnection != null) {
        voiceConnection.disconnect();
        voiceConnection = null;
        isPlaying = false;
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
            response += `${index}) ${item.title} \r\n`;
        }
        response += '```';
    }
    msg.channel.send(response);
}
//# sourceMappingURL=youtubeService.js.map