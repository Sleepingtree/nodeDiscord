import ytdl from "ytdl-core";
import { CommandInteraction, GuildMember, Message, TextBasedChannels } from "discord.js";
import { joinVoiceChannel, AudioPlayer, createAudioResource, getVoiceConnection, AudioPlayerStatus, createAudioPlayer, VoiceConnection } from '@discordjs/voice'
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
        const tempMember = msg.member;
        if (msg.channel.isText() && tempMember) {
            handleNotInGuild(msg, (guildId) => searchAndAddYoutube(guildId, tempMember, msg.content.split(BOT_PREFIX + 'play ')[1]));
        }
    } else if (msg.content.startsWith(BOT_PREFIX + 'play')) {
        handleNotInGuild(msg, (guildId) => resume(guildId));
    } else if (msg.content.startsWith(BOT_PREFIX + 'skip')) {
        handleNotInGuild(msg, (guildId) => checkAndIncrmentQueue(guildId));
    } else if (msg.content.startsWith(BOT_PREFIX + 'remove ')) {
        handleNotInGuild(msg, (guildId) => {
            const response = removeItemFromQueue(guildId, msg.content.split(BOT_PREFIX + 'remove ')[1]);
            if (response) {
                msg.channel.send(response);
            }
        });
    } else if (msg.content.startsWith(BOT_PREFIX + 'queue')) {
        handleNotInGuild(msg, (guildId) => {
            const response = listQueue(guildId);
            msg.channel.send(response);
        });
    } else if (msg.content.startsWith(BOT_PREFIX + 'pause')) {
        handleNotInGuild(msg, (guildId) => puase(guildId));
    } else if (msg.content.startsWith(BOT_PREFIX + 'clearQueue')) {
        handleNotInGuild(msg, (guildId) => closeVoiceConnection(guildId));
    } else if (msg.content.startsWith(BOT_PREFIX + 'join')) {
        handleNotInGuild(msg, (guildId) => {
            const message = getConnection(guildId, msg.member, true);
            if (typeof message === 'string') {
                msg.channel.send(message);
            }
        });
    }
});

export const songNameOption = 'song';
export const removeNameOption = 'song-number';

const notInGuildMessage = 'You must send messages in a server channel';

export const handlePlayCommand = async (interaction: CommandInteraction) => {
    const songName = interaction.options.getString(songNameOption);
    if (interaction.guildId && interaction.channel?.isText()) {
        if (songName) {
            if (interaction.member instanceof GuildMember) {
                await interaction.deferReply();
                const youtubeSong = await searchAndAddYoutube(interaction.guildId, interaction.member, songName);
                if (youtubeSong) {
                    interaction.editReply(youtubeSong)
                } else {
                    interaction.editReply(`No song found!`);
                }
            } else {
                console.warn('user is an api user?')
            }
        } else {
            interaction.reply({ ephemeral: true });
        }
    } else {
        interaction.reply(notInGuildMessage);
    }
}

export const handleSkipCommand = async (interaction: CommandInteraction) => {
    if (interaction.guildId) {
        checkAndIncrmentQueue(interaction.guildId);
        interaction.reply('skipping')
    } else {
        interaction.reply(notInGuildMessage);
    }

}

export const handleRemoveCommand = async (interaction: CommandInteraction) => {
    const itemToRemove = interaction.options.getNumber(removeNameOption);
    if (interaction.guildId) {
        const response = removeItemFromQueue(interaction.guildId, itemToRemove?.toString())
        if (response) {
            interaction.reply(response);
        }
        interaction.reply({ ephemeral: true });
    } else {
        interaction.reply(notInGuildMessage);
    }
}

export const handleQueueCommand = async (interaction: CommandInteraction) => {
    if (interaction.guildId) {
        interaction.reply(listQueue(interaction.guildId));
    } else {
        interaction.reply(notInGuildMessage);
    }
}

export const handlePauseCommand = async (interaction: CommandInteraction) => {
    if (interaction.guildId) {
        puase(interaction.guildId);
        interaction.reply('pausing');
    } else {
        interaction.reply(notInGuildMessage);
    }
}

export const handleResumeCommand = async (interaction: CommandInteraction) => {
    if (interaction.guildId) {
        const response = resume(interaction.guildId);
        interaction.reply(response ?? 'Playing');
    } else {
        interaction.reply(notInGuildMessage);
    }
}

export const handleClearQueue = async (interaction: CommandInteraction) => {
    if (interaction.guildId) {
        closeVoiceConnection(interaction.guildId);
        interaction.reply('cleared queue');
    } else {
        interaction.reply(notInGuildMessage);
    }
}

export const handleJoinCommand = async (interaction: CommandInteraction) => {
    if (interaction.guildId && interaction.channel?.isText()) {
        if (interaction.member instanceof GuildMember) {
            const connectionOrMessage = getConnection(interaction.guildId, interaction.member, true);
            if (typeof connectionOrMessage === 'string') {
                interaction.reply(connectionOrMessage);
            } else {
                interaction.reply('Joined');
            }
        } else {
            console.warn('user is an api user?');
            interaction.reply('bot broke');
        }
    } else {
        interaction.reply(notInGuildMessage);
    }
}

export function handleNotInGuild(msg: Message, cb: (guildId: string) => void) {
    if (!msg.guild?.id) {
        msg.channel.send('You must send messages in a server channel');
    } else {
        cb(msg.guild.id);
    }
}

function playYoutube(url: string, songName: string, guildId: string, member?: GuildMember) {
    const tempConnection = getConnection(guildId, member ?? null);
    if (typeof tempConnection !== 'string') {
        const resource = getPlayerResource(url);
        resource.volume?.setVolume(0.1);
        const player = createAudioPlayer();
        player.play(resource);
        player.on(AudioPlayerStatus.Idle, () => {
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
    } else {
        return tempConnection;
    }
    return tempConnection;
}

function getPlayerResource(url: string) {
    const resource = createAudioResource(ytdl(url, { quality: 'highestaudio', filter: (video) => video.hasAudio, highWaterMark: 1 << 25 }), { inlineVolume: true });
    resource.volume?.setVolume(0.2);
    return resource;
}

function getConnection(guildId: string, member: GuildMember | null, getNew?: boolean) {
    const existingConnection = getVoiceConnection(guildId);
    if (existingConnection && (existingConnection.state.status === 'signalling' || existingConnection.state.status === 'ready') && !getNew) {
        return existingConnection;
    }
    if (member) {
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            closeVoiceConnection(guildId);
            return 'you must be in a voice channel!';
        } else {
            if (voiceChannel.type === 'GUILD_STAGE_VOICE') {
                return 'You need to be in one server for this to work!';
            } else if (voiceChannel.joinable) {
                return joinVoiceChannel({
                    guildId: guildId,
                    channelId: voiceChannel.id,
                    selfDeaf: false,
                    selfMute: false,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                    debug: true
                });
            } else {
                return "I can't join that channel!";
            }
        }
    } else {
        return notInGuildMessage
    }
}

async function searchYoutube(search: string): Promise<SongQueueItem | void> {
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
            if (searchResults.data.items && searchResults.data.items[0].id?.videoId) {
                const innerSearch = await service.videos.list({
                    id: [searchResults.data.items[0].id.videoId],
                    part: ['snippet']
                });

                if (innerSearch.data.items && innerSearch.data.items[0].snippet?.title) {
                    const title = innerSearch.data.items[0].snippet.title;
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
        }
    } catch (error) {
        console.error(error);
    }
}

export async function searchAndAddYoutube(guildId: string, member: GuildMember, search: string) {
    const queueItem = await searchYoutube(search);
    const localQueue = playQueue.get(guildId) ?? [];
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
    return response ?? `added ${queueItem?.title}`;
}

export function checkAndIncrmentQueue(guildId: string) {
    const nextSong = getNextSong(guildId);
    if (nextSong) {
        const localPlayer = voicePlayerMap.get(guildId);
        if (localPlayer) {
            localPlayer.play(nextSong.resorce);
            updateBotStatus(nextSong.songname);
        } else {
            closeVoiceConnection(guildId);
        }
    } else {
        closeVoiceConnection(guildId);
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
    getVoiceConnection(guildId)?.destroy()
    if (error) {
        console.error(error);
    }
    playQueue.delete(guildId);
    voicePlayerMap.delete(guildId);
    checkAndUpdateBot();
}

function listQueue(guildId: string) {
    let response = `no songs in the queue, use ${BOT_PREFIX}play or /play to add songs`;
    const localPlayQueue = playQueue.get(guildId) ?? [];
    if (localPlayQueue.length > 0) {
        response = 'Songs in queue: ```';
        for (let index = 0; index < localPlayQueue.length; index++) {
            const item = localPlayQueue[index];
            response += `${index}) ${item.title} \r\n\r\n`
        }
        response += '```';
    }
    return response;
}

function puase(guildId: string) {
    const localVoiceStream = voicePlayerMap.get(guildId);
    if (localVoiceStream) {
        localVoiceStream.pause();
    }
}

function resume(guildId: string) {
    const localVoiceStream = voicePlayerMap.get(guildId);
    if (localVoiceStream) {
        localVoiceStream.unpause();
    } else {
        return 'Nothing is in the queue';
    }
}

function removeItemFromQueue(guildId: string, itemToRemove?: string) {
    const numberItemToRemove = Number(itemToRemove);
    const localPlayQueue = playQueue.get(guildId) ?? [];
    if (Number.isNaN(numberItemToRemove)) {
        return `the message '${BOT_PREFIX}remove ' must be followed by the number of a song in queue`;
    } else if (localPlayQueue[numberItemToRemove]) {
        if (numberItemToRemove == 0) {
            playQueue.get(guildId)?.shift();
            checkAndIncrmentQueue(guildId);
        } else {
            const removedItems = localPlayQueue.splice(numberItemToRemove, 1);
            if (localPlayQueue.length == 0) {
                closeVoiceConnection(guildId);
            } else {
                playQueue.set(guildId, localPlayQueue);
            }
            return `removed: ${removedItems[0].title}`;
        }
    } else {
        return `${itemToRemove} is not a spot in the queue`;
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