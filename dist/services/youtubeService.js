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
exports.checkAndIncrmentQueue = exports.searchAndAddYoutube = exports.handleNotInGuild = exports.handleJoinCommand = exports.handleClearQueue = exports.handleResumeCommand = exports.handlePauseCommand = exports.handleQueueCommand = exports.handleRemoveCommand = exports.handleSkipCommand = exports.handlePlayCommand = exports.removeNameOption = exports.songNameOption = void 0;
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const discordLogIn_1 = __importStar(require("./discordLogIn"));
const googleapis_1 = require("googleapis");
const voicePlayerMap = new Map();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const playQueue = new Map();
const MULTI_SERVER_PLACE_HOLDER = '%NUMB%';
const MULTI_SERVER_STATUS = `to songs on ${MULTI_SERVER_PLACE_HOLDER} servers`;
const service = googleapis_1.google.youtube({
    version: 'v3',
    auth: GOOGLE_API_KEY
});
discordLogIn_1.default.on('messageCreate', msg => {
    if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'play ')) {
        const tempMember = msg.member;
        if (msg.channel.isText() && tempMember) {
            handleNotInGuild(msg, (guildId) => (0, exports.searchAndAddYoutube)(guildId, tempMember, msg.content.split(discordLogIn_1.BOT_PREFIX + 'play ')[1]));
        }
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'play')) {
        handleNotInGuild(msg, (guildId) => resume(guildId));
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'skip')) {
        handleNotInGuild(msg, () => checkAndIncrmentQueue(''));
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'remove ')) {
        handleNotInGuild(msg, (guildId) => {
            const response = removeItemFromQueue(guildId, msg.content.split(discordLogIn_1.BOT_PREFIX + 'remove ')[1]);
            if (response) {
                msg.channel.send(response);
            }
        });
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'queue')) {
        handleNotInGuild(msg, (guildId) => {
            const response = listQueue(guildId);
            msg.channel.send(response);
        });
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'pause')) {
        handleNotInGuild(msg, (guildId) => puase(guildId));
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'clearQueue')) {
        handleNotInGuild(msg, (guildId) => closeVoiceConnection(guildId));
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'join')) {
        handleNotInGuild(msg, (guildId) => {
            const message = getConnection(guildId, msg.member, true);
            if (typeof message === 'string') {
                msg.channel.send(message);
            }
        });
    }
});
exports.songNameOption = 'song';
exports.removeNameOption = 'song-number';
const notInGuildMessage = 'You must send messages in a server channel';
const handlePlayCommand = async (interaction) => {
    var _a;
    const songName = interaction.options.getString(exports.songNameOption);
    if (interaction.guildId && ((_a = interaction.channel) === null || _a === void 0 ? void 0 : _a.isText())) {
        if (songName) {
            if (interaction.member instanceof discord_js_1.GuildMember) {
                await interaction.deferReply();
                const youtubeSong = await (0, exports.searchAndAddYoutube)(interaction.guildId, interaction.member, songName);
                // const queueItem = await searchYoutube(songName);
                // const localQueue = playQueue.get(interaction.guildId) ?? [];
                // let response;
                // if (queueItem) {
                //     localQueue.push(queueItem);
                //     playQueue.set(interaction.guildId, localQueue);
                //     if (localQueue.length === 1) {
                //         const playResponse = playYoutube(queueItem.url, queueItem.title, interaction.guildId, interaction.member);
                //         if (typeof playResponse === 'string') {
                //             response = playResponse;
                //         }
                //     }
                // }
                // return response ?? `added ${localQueue.length - 1}) ${queueItem?.title}`;
                if (youtubeSong) {
                    interaction.editReply(youtubeSong);
                }
                else {
                    interaction.editReply(`No song found!`);
                }
            }
            else {
                console.warn('user is an api user?');
            }
        }
        else {
            interaction.reply({ ephemeral: true });
        }
    }
    else {
        interaction.reply(notInGuildMessage);
    }
};
exports.handlePlayCommand = handlePlayCommand;
const handleSkipCommand = async (interaction) => {
    if (interaction.guildId) {
        checkAndIncrmentQueue(interaction.guildId);
        interaction.reply('skipping');
    }
    else {
        interaction.reply(notInGuildMessage);
    }
};
exports.handleSkipCommand = handleSkipCommand;
const handleRemoveCommand = (interaction) => {
    const itemToRemove = interaction.options.getNumber(exports.removeNameOption);
    if (interaction.guildId) {
        const response = removeItemFromQueue(interaction.guildId, itemToRemove === null || itemToRemove === void 0 ? void 0 : itemToRemove.toString());
        interaction.reply(response);
    }
    else {
        interaction.reply(notInGuildMessage);
    }
};
exports.handleRemoveCommand = handleRemoveCommand;
const handleQueueCommand = async (interaction) => {
    if (interaction.guildId) {
        interaction.reply(listQueue(interaction.guildId));
    }
    else {
        interaction.reply(notInGuildMessage);
    }
};
exports.handleQueueCommand = handleQueueCommand;
const handlePauseCommand = async (interaction) => {
    if (interaction.guildId) {
        puase(interaction.guildId);
        interaction.reply('pausing');
    }
    else {
        interaction.reply(notInGuildMessage);
    }
};
exports.handlePauseCommand = handlePauseCommand;
const handleResumeCommand = async (interaction) => {
    if (interaction.guildId) {
        const response = resume(interaction.guildId);
        interaction.reply(response !== null && response !== void 0 ? response : 'Playing');
    }
    else {
        interaction.reply(notInGuildMessage);
    }
};
exports.handleResumeCommand = handleResumeCommand;
const handleClearQueue = async (interaction) => {
    if (interaction.guildId) {
        closeVoiceConnection(interaction.guildId);
        interaction.reply('cleared queue');
    }
    else {
        interaction.reply(notInGuildMessage);
    }
};
exports.handleClearQueue = handleClearQueue;
const handleJoinCommand = async (interaction) => {
    var _a;
    if (interaction.guildId && ((_a = interaction.channel) === null || _a === void 0 ? void 0 : _a.isText())) {
        if (interaction.member instanceof discord_js_1.GuildMember) {
            const connectionOrMessage = getConnection(interaction.guildId, interaction.member, true);
            if (typeof connectionOrMessage === 'string') {
                interaction.reply(connectionOrMessage);
            }
            else {
                interaction.reply('Joined');
            }
        }
        else {
            console.warn('user is an api user?');
            interaction.reply('bot broke');
        }
    }
    else {
        interaction.reply(notInGuildMessage);
    }
};
exports.handleJoinCommand = handleJoinCommand;
function handleNotInGuild(msg, cb) {
    var _a;
    if (!((_a = msg.guild) === null || _a === void 0 ? void 0 : _a.id)) {
        msg.channel.send('You must send messages in a server channel');
        msg.author.username;
    }
    else {
        cb(msg.guild.id);
    }
}
exports.handleNotInGuild = handleNotInGuild;
function playYoutube(url, songName, guildId, member) {
    var _a;
    const tempConnection = getConnection(guildId, member !== null && member !== void 0 ? member : null);
    if (typeof tempConnection !== 'string') {
        const resource = getPlayerResource(url);
        (_a = resource.volume) === null || _a === void 0 ? void 0 : _a.setVolume(0.1);
        const player = (0, voice_1.createAudioPlayer)();
        player.play(resource);
        player.on(voice_1.AudioPlayerStatus.Idle, () => {
            const newSong = getNextSong(guildId);
            if (newSong) {
                player.play(newSong.resorce);
                checkAndUpdateBot(newSong.songname);
            }
        });
        player.on("error", (error) => {
            console.error(error);
            const newSong = getNextSong(guildId);
            if (newSong) {
                player.play(newSong.resorce);
                checkAndUpdateBot(newSong.songname);
            }
        });
        tempConnection.subscribe(player);
        voicePlayerMap.set(guildId, player);
        checkAndUpdateBot(songName);
    }
    else {
        return tempConnection;
    }
    return tempConnection;
}
function getPlayerResource(url) {
    var _a;
    const resource = (0, voice_1.createAudioResource)((0, ytdl_core_1.default)(url, { quality: 'highestaudio', filter: (video) => video.hasAudio, highWaterMark: 1 << 25 }), { inlineVolume: true });
    (_a = resource.volume) === null || _a === void 0 ? void 0 : _a.setVolume(0.2);
    return resource;
}
function getConnection(guildId, member, getNew) {
    const existingConnection = (0, voice_1.getVoiceConnection)(guildId);
    if (existingConnection && (existingConnection.state.status === 'signalling' || existingConnection.state.status === 'ready') && !getNew) {
        return existingConnection;
    }
    if (member) {
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            closeVoiceConnection(guildId);
            return 'you must be in a voice channel!';
        }
        else {
            if (voiceChannel.type === 'GUILD_STAGE_VOICE') {
                return 'You need to be in one server for this to work!';
            }
            else if (voiceChannel.joinable) {
                return (0, voice_1.joinVoiceChannel)({
                    guildId: guildId,
                    channelId: voiceChannel.id,
                    selfDeaf: false,
                    selfMute: false,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    debug: true
                });
            }
            else {
                return "I can't join that channel!";
            }
        }
    }
    else {
        return notInGuildMessage;
    }
}
async function searchYoutube(search) {
    var _a, _b;
    console.log(search);
    try {
        if (search) {
            if (search.includes('youtube.com') && search.includes('v=')) {
                const videoId = search.split('v=')[1].split('&')[0];
                search = videoId;
            }
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
    }
    catch (error) {
        console.error(error);
    }
}
const searchAndAddYoutube = async (guildId, member, search) => {
    var _a;
    const queueItem = await searchYoutube(search);
    const localQueue = (_a = playQueue.get(guildId)) !== null && _a !== void 0 ? _a : [];
    let response;
    if (queueItem) {
        localQueue.push(queueItem);
        playQueue.set(guildId, localQueue);
        if (localQueue.length === 1) {
            const playResponse = playYoutube(queueItem.url, queueItem.title, guildId, member);
            if (typeof playResponse === 'string') {
                response = playResponse;
            }
        }
    }
    return response !== null && response !== void 0 ? response : `added ${localQueue.length - 1}) ${queueItem === null || queueItem === void 0 ? void 0 : queueItem.title}`;
};
exports.searchAndAddYoutube = searchAndAddYoutube;
function checkAndIncrmentQueue(guildId) {
    const nextSong = getNextSong(guildId);
    if (nextSong) {
        const localPlayer = voicePlayerMap.get(guildId);
        if (localPlayer) {
            localPlayer.play(nextSong.resorce);
            (0, discordLogIn_1.updateBotStatus)(nextSong.songname);
        }
        else {
            closeVoiceConnection(guildId);
        }
    }
    else {
        closeVoiceConnection(guildId);
    }
}
exports.checkAndIncrmentQueue = checkAndIncrmentQueue;
function getNextSong(guildId) {
    const localQueue = playQueue.get(guildId);
    if (localQueue) {
        localQueue.shift();
        playQueue.set(guildId, localQueue);
        if (localQueue.length > 0) {
            return { resorce: getPlayerResource(localQueue[0].url), songname: localQueue[0].title };
        }
        else {
            closeVoiceConnection(guildId);
        }
    }
}
function closeVoiceConnection(guildId, error) {
    var _a;
    let localVoicePlayer = voicePlayerMap.get(guildId);
    if (localVoicePlayer) {
        localVoicePlayer.playable.forEach(player => player.disconnect());
        localVoicePlayer.stop();
    }
    (_a = (0, voice_1.getVoiceConnection)(guildId)) === null || _a === void 0 ? void 0 : _a.destroy();
    if (error) {
        console.error(error);
    }
    playQueue.delete(guildId);
    voicePlayerMap.delete(guildId);
    checkAndUpdateBot();
}
function listQueue(guildId) {
    var _a;
    let response = `no songs in the queue, use ${discordLogIn_1.BOT_PREFIX}play or /play to add songs`;
    const localPlayQueue = (_a = playQueue.get(guildId)) !== null && _a !== void 0 ? _a : [];
    if (localPlayQueue.length > 0) {
        response = 'Songs in queue: ```';
        for (let index = 0; index < localPlayQueue.length; index++) {
            const item = localPlayQueue[index];
            response += `${index}) ${item.title} \r\n\r\n`;
        }
        response += '```';
    }
    return response;
}
function puase(guildId) {
    const localVoiceStream = voicePlayerMap.get(guildId);
    if (localVoiceStream) {
        localVoiceStream.pause();
    }
}
function resume(guildId) {
    const localVoiceStream = voicePlayerMap.get(guildId);
    if (localVoiceStream) {
        localVoiceStream.unpause();
    }
    else {
        return 'Nothing is in the queue';
    }
}
function removeItemFromQueue(guildId, itemToRemove) {
    var _a, _b;
    const numberItemToRemove = Number(itemToRemove);
    const localPlayQueue = (_a = playQueue.get(guildId)) !== null && _a !== void 0 ? _a : [];
    if (Number.isNaN(numberItemToRemove)) {
        return `the message '${discordLogIn_1.BOT_PREFIX}remove ' must be followed by the number of a song in queue`;
    }
    else if (localPlayQueue[numberItemToRemove]) {
        if (numberItemToRemove == 0) {
            (_b = playQueue.get(guildId)) === null || _b === void 0 ? void 0 : _b.shift();
            checkAndIncrmentQueue(guildId);
            return 'Skipped last song';
        }
        else {
            const removedItems = localPlayQueue.splice(numberItemToRemove, 1);
            if (localPlayQueue.length == 0) {
                closeVoiceConnection(guildId);
            }
            else {
                playQueue.set(guildId, localPlayQueue);
            }
            return `removed: ${removedItems[0].title}`;
        }
    }
    else {
        return `${itemToRemove} is not a spot in the queue`;
    }
}
function checkAndUpdateBot(songName) {
    var _a, _b;
    //get bot status
    let presense = (_a = discordLogIn_1.default.user) === null || _a === void 0 ? void 0 : _a.presence;
    const botStatus = (_b = presense === null || presense === void 0 ? void 0 : presense.activities[0]) === null || _b === void 0 ? void 0 : _b.name;
    const serversListening = [...voicePlayerMap].length;
    const newSeverCountMessage = MULTI_SERVER_STATUS.replace(MULTI_SERVER_PLACE_HOLDER, `${serversListening}`);
    if (serversListening === 1 && songName) {
        (0, discordLogIn_1.updateBotStatus)(songName, { type: "LISTENING" });
    }
    else if (serversListening > 1 && botStatus !== newSeverCountMessage) {
        (0, discordLogIn_1.updateBotStatus)(newSeverCountMessage, { type: "LISTENING" });
    }
    else {
        (0, discordLogIn_1.updateBotStatus)();
    }
    ``;
}
//# sourceMappingURL=youtubeService.js.map