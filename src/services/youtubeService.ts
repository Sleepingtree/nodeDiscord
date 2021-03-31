import ytdl from "ytdl-core";
import { VoiceConnection, Message, StreamDispatcher } from "discord.js";
import bot, { BOT_PREFIX } from './discordLogIn';
import { google } from 'googleapis';
import SongQueueItem from "../model/songQueue";

let voiceConnection: VoiceConnection | undefined;
let voiceStream: StreamDispatcher | undefined;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const playQueue: SongQueueItem[] = [];

const service = google.youtube({
    version: 'v3',
    auth: GOOGLE_API_KEY
});


bot.on('message', msg => {
    if (msg.content.startsWith(BOT_PREFIX + 'play ')) {
        searchAndAddYoutube(msg, msg.content.split(BOT_PREFIX + 'play ')[1]);
    } else if (msg.content.startsWith(BOT_PREFIX + 'play')) {
        resume(msg);
    } else if (msg.content.startsWith(BOT_PREFIX + 'skip')) {
        checkAndIncrmentQueue(msg);
    } else if (msg.content.startsWith(BOT_PREFIX + 'remove ')) {
        removeItemFromQueue(msg, msg.content.split(BOT_PREFIX + 'remove ')[1]);
    } else if (msg.content.startsWith(BOT_PREFIX + 'queue')) {
        listQueue(msg);
    } else if (msg.content.startsWith(BOT_PREFIX + 'pause')) {
        puase();
    } else if (msg.content.startsWith(BOT_PREFIX + 'clearQueue')) {
        closeVoiceConnection();
    }
});


async function playYoutube(msg: Message, url: string, songName: string) {

    const tempConnection = await getConnection(msg);
    bot.user?.setActivity(songName, {type: "LISTENING"});
    voiceStream = tempConnection.play(ytdl(url, { quality: 'highestaudio' }), { volume: 0.1 })
        .on("finish", () => checkAndIncrmentQueue(msg))
        .on("error", closeVoiceConnection);
}

async function getConnection(msg: Message) {
    if (voiceConnection) {
        return voiceConnection;
    }
    if (msg.member) {
        const channel = msg.member.voice.channel;
        if (!channel) {
            msg.channel.send('you must be in a voice channel!');
        } else {
            const tempConnection = await channel.join();
            voiceConnection = tempConnection;
            return tempConnection;
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
                }
            }
        }
        msg.channel.send('You need to search on something!');
    } catch (error) {
        console.error(error);
    }
    console.error('Shouldn\'t be here');
}

async function searchAndAddYoutube(msg: Message, search: string) {
    const queueItem = await searchYoutube(msg, search);
    const isQueueEmpty = playQueue.length == 0;
    if (queueItem) {
        playQueue.push(queueItem);
        if (isQueueEmpty) {
            playYoutube(msg, queueItem.url, queueItem.title);
        }
    }
}

function checkAndIncrmentQueue(msg: Message) {
    playQueue.shift();
    if (playQueue.length > 0) {
        playYoutube(msg, playQueue[0].url, playQueue[0].title);
    } else {
        closeVoiceConnection();
    }
}

function closeVoiceConnection(error?: Error) {
    if (voiceConnection) {
        voiceConnection.disconnect(); 
    }
    if (error) {
        console.error(error);
    }
    playQueue.splice(0, playQueue.length);
    bot.user?.setActivity();
    voiceConnection = undefined;
    voiceStream = undefined;
}

function listQueue(msg: Message) {
    let response = `no songs in the queue, use ${BOT_PREFIX}play to add songs`;
    if (playQueue.length > 0) {
        response = 'Songs in queue: ```';
        for (let index = 0; index < playQueue.length; index++) {
            const item = playQueue[index];
            response += `${index}) ${item.title} \r\n\r\n`
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

function resume(msg: Message) {
    if (voiceStream) {
        voiceStream.resume();
    } else {
        msg.channel.send('Nothing is in the queue');
    }
}

function removeItemFromQueue(msg: Message, itemToRemove: string) {
    const numberItemToRemove = Number(itemToRemove);
    if (Number.isNaN(numberItemToRemove)) {
        msg.channel.send(`the message '${BOT_PREFIX}remove ' must be followed by the number of a song in queue`);
    } else if (playQueue[numberItemToRemove]) {
        if (numberItemToRemove == 0) {
            checkAndIncrmentQueue(msg);
        } else {
            const removedItems = playQueue.splice(numberItemToRemove, 1);
            msg.channel.send(`removed: ${removedItems[0].title}`)
            if (playQueue.length == 0) {
                closeVoiceConnection();
            }
        }
    } else {
        msg.channel.send(`${itemToRemove} is not a spot in the queue`);
    }
}