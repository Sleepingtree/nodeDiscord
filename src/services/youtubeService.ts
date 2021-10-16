import ytdl from "ytdl-core";
import { Message } from "discord.js";
import { joinVoiceChannel, AudioPlayer, createAudioPlayer, createAudioResource, getVoiceConnection } from '@discordjs/voice'
import bot, { BOT_PREFIX, updateBotStatus } from './discordLogIn';
import { google } from 'googleapis';
import SongQueueItem from "../model/songQueue";

const voicePlayerMap = new Map<string, AudioPlayer>();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const playQueue = new Map<string, SongQueueItem[]>();
const MULTI_SERVER_PLACE_HOLDER = '%NUMB%';
const MULTI_SERVER_STATUS = `to songs on ${MULTI_SERVER_PLACE_HOLDER} servers`;


const service = google.youtube({
    version: 'v3',
    auth: GOOGLE_API_KEY
});

bot.on('messageCreate', msg => {
    if (msg.content.startsWith(BOT_PREFIX + 'play ')) {
        handleNotInGuild(msg, (guildId) => searchAndAddYoutube(guildId, msg, msg.content.split(BOT_PREFIX + 'play ')[1]));
    } else if (msg.content.startsWith(BOT_PREFIX + 'play')) {
        handleNotInGuild(msg, (guildId) => resume(guildId, msg));
    } else if (msg.content.startsWith(BOT_PREFIX + 'skip')) {
        handleNotInGuild(msg, (guildId) => checkAndIncrmentQueue(guildId));
    } else if (msg.content.startsWith(BOT_PREFIX + 'remove ')) {
        handleNotInGuild(msg, (guildId) => removeItemFromQueue(guildId, msg, msg.content.split(BOT_PREFIX + 'remove ')[1]));
    } else if (msg.content.startsWith(BOT_PREFIX + 'queue')) {
        handleNotInGuild(msg, (guildId) => listQueue(guildId, msg));
    } else if (msg.content.startsWith(BOT_PREFIX + 'pause')) {
        handleNotInGuild(msg, (guildId) => puase(guildId));
    } else if (msg.content.startsWith(BOT_PREFIX + 'clearQueue')) {
        handleNotInGuild(msg, (guildId) => closeVoiceConnection(guildId));
    } else if (msg.content.startsWith(BOT_PREFIX + 'join')) {
        handleNotInGuild(msg, (guildId) => getConnection(guildId, msg, true));
    }
});

function handleNotInGuild(msg: Message, cb: (guildId: string) => void) {
    if (!msg.guild?.id) {
        msg.channel.send('You must send messages in a server channel');
    } else {
        cb(msg.guild.id);
    }
}

function playYoutube(url: string, songName: string, guildId: string, msg?: Message) {
    const tempConnection = getConnection(guildId, msg);

    if (tempConnection) {
        const resource = getPlayerResource(url);
        resource.volume?.setVolume(0.1);
        const player = createAudioPlayer();
        player.play(resource);
        player.on('stateChange', (_oldState, newState) => {
            if (newState.status === 'idle') {
                const newSong = getNextSong(guildId);
                if (newSong) {
                    player.play(newSong.resorce);
                    checkAndUpdateBot(newSong.songname);
                }
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
}

function getPlayerResource(url: string) {
    const resource = createAudioResource(ytdl(url, { quality: 'highestaudio', filter: (video) => video.hasAudio, highWaterMark: 1 << 25 }), { inlineVolume: true });
    resource.volume?.setVolume(0.2);
    return resource;
}

function getConnection(guildId: string, msg?: Message, getNew?: boolean) {
    const existingConnection = getVoiceConnection(guildId);
    if (existingConnection && existingConnection.state.status !== 'disconnected' && !getNew) {
        return existingConnection;
    }
    if (msg?.member) {
        const channel = msg.member.voice.channel;
        if (!channel) {
            closeVoiceConnection(guildId);
            msg.channel.send('you must be in a voice channel!');
        } else {
            if (channel.guild.id !== guildId || channel.type === 'GUILD_STAGE_VOICE') {
                msg.channel.send('You need to be in one server for this to work!');
            } else {
                return joinVoiceChannel({
                    guildId: guildId,
                    channelId: channel.id,
                    selfDeaf: false,
                    selfMute: false,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                });
            }
        }
    }
}

async function searchYoutube(msg: Message, search: string): Promise<SongQueueItem | void> {
    console.log(search);
    try {
        if (search) {
            const searchResults = await service.search.list({
                q: search,
                part: ['snippet'],
                maxResults: 1
            });

            if (searchResults.data.items && searchResults.data.items[0].id?.videoId) {
                const innerSearch = await service.videos.list({
                    id: [searchResults.data.items[0].id.videoId],
                    part: ['snippet']
                });

                if (innerSearch.data.items && innerSearch.data.items[0].snippet?.title) {
                    const title = innerSearch.data.items[0].snippet.title;
                    msg.channel.send(`added: ${title}`);
                    return {
                        url: `https://www.youtube.com/watch?v=${searchResults.data.items[0].id.videoId}`,
                        title: title
                    };
                } else {
                    console.error(`Inner search items ${typeof innerSearch.data.items}`);
                }
            } else {
                console.error(`Search results status was ${searchResults.status} data ${searchResults.data.items}`);
            }
        } else {
            msg.channel.send('You need to search on something!');
        }
    } catch (error) {
        console.error(error);
    }
}

async function searchAndAddYoutube(guildId: string, msg: Message, search: string) {
    const queueItem = await searchYoutube(msg, search);
    const localQueue = playQueue.get(guildId) ?? [];
    if (queueItem) {
        localQueue.push(queueItem);
        playQueue.set(guildId, localQueue);
        if (localQueue.length === 1) {
            playYoutube(queueItem.url, queueItem.title, guildId, msg);
        }
    }
}

function checkAndIncrmentQueue(guildId: string) {
    const nextSong = getNextSong(guildId);
    if (nextSong) {
        const localPlayer = voicePlayerMap.get(guildId);
        if (localPlayer) {
            localPlayer.play(nextSong.resorce);
            updateBotStatus(nextSong.songname);
        } else {
            closeVoiceConnection(guildId);
        }
    }
}

function getNextSong(guildId: string) {
    const localQueue = playQueue.get(guildId);
    if (localQueue) {
        localQueue.shift();
        playQueue.set(guildId, localQueue);
        if (localQueue.length > 0) {
            return { resorce: getPlayerResource(localQueue[0].url), songname: localQueue[0].title };
        } else {
            closeVoiceConnection(guildId);
        }
    }
}

function closeVoiceConnection(guildId: string, error?: Error) {
    let localVoicePlayer = voicePlayerMap.get(guildId);
    if (localVoicePlayer) {
        localVoicePlayer.playable.forEach(player => player.disconnect());
        localVoicePlayer.stop();
    }
    if (error) {
        console.error(error);
    }
    playQueue.delete(guildId);
    voicePlayerMap.delete(guildId);
    checkAndUpdateBot();
}

function listQueue(guildId: string, msg: Message) {
    let response = `no songs in the queue, use ${BOT_PREFIX}play to add songs`;
    const localPlayQueue = playQueue.get(guildId) ?? [];
    if (localPlayQueue.length > 0) {
        response = 'Songs in queue: ```';
        for (let index = 0; index < localPlayQueue.length; index++) {
            const item = localPlayQueue[index];
            response += `${index}) ${item.title} \r\n\r\n`
        }
        response += '```';
    }
    msg.channel.send(response);
}

function puase(guildId: string) {
    const localVoiceStream = voicePlayerMap.get(guildId);
    if (localVoiceStream) {
        localVoiceStream.pause();
    }
}

function resume(guildId: string, msg: Message) {
    const localVoiceStream = voicePlayerMap.get(guildId);
    if (localVoiceStream) {
        localVoiceStream.unpause();
    } else {
        msg.channel.send('Nothing is in the queue');
    }
}

function removeItemFromQueue(guildId: string, msg: Message, itemToRemove: string) {
    const numberItemToRemove = Number(itemToRemove);
    const localPlayQueue = playQueue.get(guildId) ?? [];
    if (Number.isNaN(numberItemToRemove)) {
        msg.channel.send(`the message '${BOT_PREFIX}remove ' must be followed by the number of a song in queue`);
    } else if (localPlayQueue[numberItemToRemove]) {
        if (numberItemToRemove == 0) {
            playQueue.get(guildId)?.shift();
            checkAndIncrmentQueue(guildId);
        } else {
            const removedItems = localPlayQueue.splice(numberItemToRemove, 1);
            msg.channel.send(`removed: ${removedItems[0].title}`)
            if (localPlayQueue.length == 0) {
                closeVoiceConnection(guildId);
            } else {
                playQueue.set(guildId, localPlayQueue);
            }
        }
    } else {
        msg.channel.send(`${itemToRemove} is not a spot in the queue`);
    }
}

function checkAndUpdateBot(songName?: string) {
    //get bot status
    let presense = bot.user?.presence;
    const botStatus = presense?.activities[0]?.name;
    const serversListening = [...voicePlayerMap].length;
    const newSeverCountMessage = MULTI_SERVER_STATUS.replace(MULTI_SERVER_PLACE_HOLDER, `${serversListening}`);

    if (serversListening === 1 && songName) {
        updateBotStatus(songName, { type: "LISTENING" });
    } else if (serversListening > 1 && botStatus !== newSeverCountMessage) {
        updateBotStatus(newSeverCountMessage, { type: "LISTENING" });
    } else {
        updateBotStatus();
    } ``
}