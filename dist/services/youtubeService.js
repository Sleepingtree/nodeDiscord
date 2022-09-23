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
exports.checkAndIncrmentQueue = exports.handleNotInGuild = exports.handleJoinCommand = exports.handleClearQueue = exports.handleResumeCommand = exports.handlePauseCommand = exports.handleQueueCommand = exports.handleRemoveCommand = exports.handleSkipCommand = exports.handlePlayCommand = exports.removeNameOption = exports.songNameOption = void 0;
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
            handleNotInGuild(msg, (guildId) => searchAndAddYoutubeGenerator(guildId, tempMember, msg.content.split(discordLogIn_1.BOT_PREFIX + 'play ')[1]));
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
                const searchGenerator = searchAndAddYoutubeGenerator(interaction.guildId, interaction.member, songName);
                console.log(`searchGenerator ${searchGenerator}`);
                let nextVal = (await searchGenerator.next()).value;
                do {
                    if (nextVal) {
                        console.log(`got val ${nextVal}`);
                        interaction.editReply(nextVal);
                        nextVal = (await searchGenerator.next()).value;
                        console.log(`got val 2 ${nextVal}`);
                    }
                    else {
                        interaction.editReply(`No song found!`);
                    }
                } while (nextVal);
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
    console.log(`playing song: ${songName} from URL: ${url}`);
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
    var _a, _b, _c;
    console.log(`Searching with value ${search}`);
    try {
        if (search) {
            if (search.includes('youtube.com') && search.includes('v=')) {
                const params = new URL(search).searchParams;
                search = (_a = params.get("v")) !== null && _a !== void 0 ? _a : search;
            }
            const searchResults = await service.search.list({
                q: search,
                part: ['snippet'],
                maxResults: 1
            });
            if (searchResults.data.items && ((_b = searchResults.data.items[0].id) === null || _b === void 0 ? void 0 : _b.videoId)) {
                const innerSearch = await service.videos.list({
                    id: [searchResults.data.items[0].id.videoId],
                    part: ['snippet']
                });
                if (innerSearch.data.items && ((_c = innerSearch.data.items[0].snippet) === null || _c === void 0 ? void 0 : _c.title)) {
                    const title = innerSearch.data.items[0].snippet.title;
                    return {
                        url: generateYouTubeURL(searchResults.data.items[0].id.videoId),
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
async function* searchYoutubePlaylistGenerator(listId) {
    const maxResults = 10;
    let pageToken = undefined;
    try {
        let playlistItems = undefined;
        do {
            playlistItems = await service.playlistItems.list({ playlistId: listId, part: ["snippet"], maxResults, pageToken });
            if (playlistItems.data.items && playlistItems.data.items.length > 0) {
                pageToken = playlistItems.data.nextPageToken;
                yield playlistItems.data.items
                    .map(item => {
                    var _a, _b, _c, _d, _e;
                    if (((_b = (_a = item.snippet) === null || _a === void 0 ? void 0 : _a.resourceId) === null || _b === void 0 ? void 0 : _b.videoId) && ((_c = item.snippet) === null || _c === void 0 ? void 0 : _c.title)) {
                        return {
                            url: generateYouTubeURL((_e = (_d = item.snippet) === null || _d === void 0 ? void 0 : _d.resourceId) === null || _e === void 0 ? void 0 : _e.videoId),
                            title: item.snippet.title
                        };
                    }
                    else {
                        return undefined;
                    }
                })
                    .filter((item) => item !== undefined);
            }
            else {
                return undefined;
            }
        } while (pageToken);
    }
    catch (e) {
        console.error(e);
        return undefined;
    }
}
async function* searchAndAddYoutubeGenerator(guildId, member, search) {
    var _a, _b, _c, _d, _e, _f;
    let urlPrams;
    try {
        urlPrams = new URL(search).searchParams;
    }
    catch (e) {
    }
    const listId = urlPrams === null || urlPrams === void 0 ? void 0 : urlPrams.get("list");
    const queueDepth = (_a = playQueue.get(guildId)) === null || _a === void 0 ? void 0 : _a.length;
    const callPlay = queueDepth === undefined || queueDepth === 0;
    let retVal = undefined;
    if (listId) {
        const playListResultGenerator = searchYoutubePlaylistGenerator(listId);
        console.log(`got gen ${playListResultGenerator}`);
        let item = (await playListResultGenerator.next()).value;
        let count = (_b = item === null || item === void 0 ? void 0 : item.length) !== null && _b !== void 0 ? _b : 0;
        do {
            console.log(`got items\n---------\n${item === null || item === void 0 ? void 0 : item.map(test => test.title).join('\n')}`);
            count += (_c = item === null || item === void 0 ? void 0 : item.length) !== null && _c !== void 0 ? _c : 0;
            if (item) {
                let localQueue = (_d = playQueue.get(guildId)) !== null && _d !== void 0 ? _d : [];
                localQueue = localQueue.concat(item);
                playQueue.set(guildId, localQueue);
            }
            yield `added ${count} songs to the queue`;
            item = (await playListResultGenerator.next()).value;
        } while (item);
    }
    else {
        const queueItem = await searchYoutube(search);
        if (queueItem) {
            const localQueue = (_e = playQueue.get(guildId)) !== null && _e !== void 0 ? _e : [];
            localQueue.push(queueItem);
            playQueue.set(guildId, localQueue);
            retVal = `added ${localQueue.length - 1}) ${queueItem === null || queueItem === void 0 ? void 0 : queueItem.title}`;
        }
    }
    const localQueue = (_f = playQueue.get(guildId)) !== null && _f !== void 0 ? _f : [];
    console.log(`calling play? ${callPlay} and length : ${localQueue.length}`);
    if (callPlay && localQueue.length > 0) {
        const playResponse = playYoutube(localQueue[0].url, localQueue[0].title, guildId, member);
        if (typeof playResponse === 'string') {
            retVal = playResponse;
        }
    }
    return retVal;
}
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
            console.log(`playing song: ${localQueue[0].title} from URL: ${localQueue[0].url}`);
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
//TODO get this to work
function listQueue(guildId) {
    var _a;
    let response = `no songs in the queue, use ${discordLogIn_1.BOT_PREFIX}play or /play to add songs`;
    const localPlayQueue = (_a = playQueue.get(guildId)) !== null && _a !== void 0 ? _a : [];
    if (localPlayQueue.length > 0) {
        response = 'Songs in queue: ```';
        let midAdded = false;
        localPlayQueue.forEach((item, index) => {
            if (index < 10 || index > localPlayQueue.length - 10) {
                response += `${index}) ${item.title} \r\n\r\n`;
            }
            else if (!midAdded) {
                response += `______skippping ${localPlayQueue.length - 20} for brevity______\r\n\r\n`;
                midAdded = true;
            }
        });
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
}
const generateYouTubeURL = (id) => `https://www.youtube.com/watch?v=${id}`;
//# sourceMappingURL=youtubeService.js.map