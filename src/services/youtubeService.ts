import ytdl from "ytdl-core";
import {VoiceConnection, Message} from "discord.js";
import bot, {BOT_PREFIX} from './discordLogIn';
import { google } from 'googleapis';
import SongQueueItem from "../model/SongQueue";

let voiceConnection : VoiceConnection = null;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

const playQueue: SongQueueItem[] = [];
let isPlaying = false;

const service = google.youtube({
    version: 'v3',
    auth : GOOGLE_API_KEY
});


bot.on('message', msg => {
    if (msg.content.startsWith(BOT_PREFIX + 'okite')) {
        playYoutube(msg, 'https://www.youtube.com/watch?v=6QBw0FVlPiI');
    }else if (msg.content.startsWith(BOT_PREFIX + 'shitPost')) {
        playYoutube(msg, 'https://www.youtube.com/watch?v=fLaNJLZK21Y');
    }else if(msg.content.startsWith(BOT_PREFIX + 'play ')){
        searchAndAddYoutube(msg, msg.content.split(BOT_PREFIX + 'play ')[1]);
    }else if(msg.content.startsWith(BOT_PREFIX + 'skip')){
        checkAndIncrmentQueue(msg);
    }else if(msg.content.startsWith(BOT_PREFIX + 'queue')){
        listQueue(msg);
    }
});


async function playYoutube(msg: Message, url: string){
    if(voiceConnection === null){
        await getConnection(msg);
    }
    voiceConnection.play(ytdl(url, {quality: 'highestaudio'}), {volume: 0.1})
        .on("finish", () => checkAndIncrmentQueue(msg))
        .on("error", closeVoiceConnection);
}

async function getConnection(msg: Message){
    const channel = msg.member.voice.channel;
    if(!channel){
        msg.channel.send('you must be in a voice channel!');
    }else{
        voiceConnection = await channel.join();
    }
}

async function searchYoutube(msg: Message, search: string): Promise<SongQueueItem>{
    console.log(search);
    try {
        if(search){
            const searchResults = await service.search.list({
                q: search,
                part: ['snippet']
            });
            const title = await service.videos.list({
                id: [searchResults.data.items[0].id.videoId],
                part: ['snippet']
            }).then(item =>item.data.items[0].snippet.title);
            return {
                url: `https://www.youtube.com/watch?v=${searchResults.data.items[0].id.videoId}`,
                title: title
            };
        }
        msg.channel.send('You need to search on something!');
    } catch (error) {
        console.error(error);
    }
    
    return null;
}

async function searchAndAddYoutube(msg: Message, search: string){
    const queueItem = await searchYoutube(msg, search);
    const isQueueEmpty = playQueue.length == 0;
    if(queueItem){
        playQueue.push(queueItem);
        if(isQueueEmpty){
            playYoutube(msg, queueItem.url);
        }
    }
}

function checkAndIncrmentQueue(msg: Message){
    playQueue.shift();
    if(playQueue.length > 0){
        playYoutube(msg, playQueue[0].url);
    }else{
        closeVoiceConnection();
    }
}

function closeVoiceConnection(error? :Error){
    if(voiceConnection != null){
        voiceConnection.disconnect();
        voiceConnection = null;
        isPlaying = false;
    }
    if(error){
        console.error(error);
    }
}

function listQueue(msg: Message){
    let response = `no songs in the queue, use ${BOT_PREFIX}play to add songs`;
    if(playQueue.length >0){
        response = 'Songs in queue: ```';
        for(let index = 0; index < playQueue.length; index ++){
            const item = playQueue[index];
            response += `${index}) ${item.title} \r\n`
        }
        response += '```';
    }
    msg.channel.send(response);
}