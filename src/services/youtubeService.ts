import ytdl from "ytdl-core";
import { Message } from "discord.js";
import { VoiceConnection, joinVoiceChannel, AudioPlayer, createAudioPlayer, createAudioResource } from '@discordjs/voice'
import bot, { BOT_PREFIX, updateBotStatus } from './discordLogIn';
import { google } from 'googleapis';
import SongQueueItem from "../model/songQueue";

const voiceConnectionMap: { [key: string]: VoiceConnection | undefined } = {};
const voicePlayerMap: { [key: string]: AudioPlayer | undefined } = {};
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const playQueue: { [key: string]: SongQueueItem[] | undefined } = {};

const service = google.youtube({
    version: 'v3',
    auth: GOOGLE_API_KEY
});

bot.on('message', msg => {
    if (msg.content.startsWith(BOT_PREFIX + 'play ')) {
        handleNotInGuild(msg, (guildId) => searchAndAddYoutube(guildId, msg, msg.content.split(BOT_PREFIX + 'play ')[1]));
    } else if (msg.content.startsWith(BOT_PREFIX + 'play')) {
        handleNotInGuild(msg, (guildId) => resume(guildId, msg));
    } else if (msg.content.startsWith(BOT_PREFIX + 'skip')) {
        handleNotInGuild(msg, (guildId) => checkAndIncrmentQueue(guildId, msg));
    } else if (msg.content.startsWith(BOT_PREFIX + 'remove ')) {
        handleNotInGuild(msg, (guildId) => removeItemFromQueue(guildId, msg, msg.content.split(BOT_PREFIX + 'remove ')[1]));
    } else if (msg.content.startsWith(BOT_PREFIX + 'queue')) {
        handleNotInGuild(msg, (guildId) => listQueue(guildId, msg));
    } else if (msg.content.startsWith(BOT_PREFIX + 'pause')) {
        handleNotInGuild(msg, (guildId) => puase(guildId));
    } else if (msg.content.startsWith(BOT_PREFIX + 'clearQueue')) {
        handleNotInGuild(msg, (guildId) => closeVoiceConnection(guildId));
    }
});

function handleNotInGuild(msg: Message, cb: (guildId: string) => void) {
    if (!msg.guild?.id) {
        msg.channel.send('You must send messages in a server channel');
    } else {
        cb(msg.guild.id);
    }
}

async function playYoutube(url: string, songName: string, guildId: string, msg?: Message) {
    const tempConnection = await getConnection(guildId, msg);
    const resource = createAudioResource(ytdl(url, { quality: 'highestaudio', filter: (video) => video.hasAudio }));
    const player = createAudioPlayer();
    player.play(resource);
    player.on('stateChange', (_oldState, newState) => {
        if (newState.status === 'idle') {
            checkAndIncrmentQueue(guildId, msg);
        }
    });
    tempConnection.subscribe(player);
    // voiceStreamMap[guildId] = tempConnection.play(ytdl(url, { quality: 'highestaudio', filter: (video) => video.hasAudio }), { volume: 0.1 })
    //     .on("finish", () => checkAndIncrmentQueue(guildId, msg))
    //     .on("error", (error) => {
    //         checkAndIncrmentQueue(guildId);
    //         console.error(error);
    //     });
    updateBotStatus(songName, { type: "LISTENING" });
}

async function getConnection(guildId: string, msg?: Message) {
    const existingConnection = voiceConnectionMap[guildId];
    if (existingConnection) {
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
                const voiceConnectionConfig = {
                    guildId: guildId,
                    channelId: channel.id,
                    selfDeaf: false,
                    selfMute: false,
                    adapterCreator: channel.guild.voiceAdapterCreator,
                }
                const tempConnection = joinVoiceChannel(voiceConnectionConfig)
                voiceConnectionMap[guildId] = tempConnection;
                return tempConnection;
            }
        }
    }
    //If connection was not gotten throw caller needs to handle it
    throw `Either member was not in a channel or was unable to get a voice connection`;
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
    const localQueue = playQueue[guildId] ?? [];
    if (queueItem) {
        localQueue.push(queueItem);
        playQueue[guildId] = localQueue;
        if (localQueue.length === 1) {
            playYoutube(queueItem.url, queueItem.title, guildId, msg);
        }
    }
}
/**
 * @deprecated
 * @param guildId 
 * @param msg 
 */
function checkAndIncrmentQueue(guildId: string, msg?: Message) {
    const localQueue = playQueue[guildId];
    if (localQueue) {
        localQueue.shift();
        playQueue[guildId] = localQueue;
        if (localQueue.length > 0) {
            playYoutube(localQueue[0].url, localQueue[0].title, guildId, msg);
        } else {
            closeVoiceConnection(guildId);
        }
    }
}

function closeVoiceConnection(guildId: string, error?: Error) {
    let localVoicConnection = voiceConnectionMap[guildId];
    if (localVoicConnection) {
        localVoicConnection.destroy();
    }
    if (error) {
        console.error(error);
    }
    playQueue[guildId] = [];
    updateBotStatus();
    voiceConnectionMap[guildId] = undefined;
    voicePlayerMap[guildId] = undefined;
}

function listQueue(guildId: string, msg: Message) {
    let response = `no songs in the queue, use ${BOT_PREFIX}play to add songs`;
    const localPlayQueue = playQueue[guildId] ?? [];
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
    const localVoiceStream = voicePlayerMap[guildId];
    if (localVoiceStream) {
        localVoiceStream.pause();
    }
}

function resume(guildId: string, msg: Message) {
    const localVoiceStream = voicePlayerMap[guildId];
    if (localVoiceStream) {
        localVoiceStream.unpause();
    } else {
        msg.channel.send('Nothing is in the queue');
    }
}

function removeItemFromQueue(guildId: string, msg: Message, itemToRemove: string) {
    const numberItemToRemove = Number(itemToRemove);
    const localPlayQueue = playQueue[guildId] ?? [];
    if (Number.isNaN(numberItemToRemove)) {
        msg.channel.send(`the message '${BOT_PREFIX}remove ' must be followed by the number of a song in queue`);
    } else if (localPlayQueue[numberItemToRemove]) {
        if (numberItemToRemove == 0) {
            checkAndIncrmentQueue(guildId, msg);
        } else {
            const removedItems = localPlayQueue.splice(numberItemToRemove, 1);
            msg.channel.send(`removed: ${removedItems[0].title}`)
            if (localPlayQueue.length == 0) {
                closeVoiceConnection(guildId);
            } else {
                playQueue[guildId] = localPlayQueue;
            }
        }
    } else {
        msg.channel.send(`${itemToRemove} is not a spot in the queue`);
    }
}