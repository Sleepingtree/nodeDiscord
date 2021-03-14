import ytdl from "ytdl-core";
import {Client, VoiceConnection, VoiceChannel} from "discord.js";
import bot from './discordLogIn';
import {BOT_PREFIX} from './discordLogIn';
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;

let voiceConnection : VoiceConnection = null;

bot.on('message', msg => {
    if (msg.content.startsWith(BOT_PREFIX + 'okite')) {
        playYoutube('https://www.youtube.com/watch?v=6QBw0FVlPiI');
    }else if (msg.content.startsWith(BOT_PREFIX + 'shitPost')) {
        playYoutube('https://www.youtube.com/watch?v=fLaNJLZK21Y');
    }
});

export async function playYoutube(youTube: string){
    if(voiceConnection === null){
        voiceConnection = await getConnection();
    }
    voiceConnection.play(ytdl(youTube, {quality: 'highestaudio'}), {volume: 0.1})
        .on("finish", () => {
                if(voiceConnection != null){
                    voiceConnection.disconnect();
                    voiceConnection == null;
                }  
            })
        .on("error", error => {
            console.error(error);
            if(voiceConnection != null){
                voiceConnection.disconnect();
                voiceConnection = null;
            }
        });
}

async function getConnection(){
     const channel  = <VoiceChannel> await bot.channels.fetch(VOICE_CHANNEL_ID);
     return await channel.join();
}