import ytdl from "ytdl-core";
import {Client, VoiceConnection, VoiceChannel} from "discord.js";
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;

let voiceConnection : VoiceConnection = null;

export async function playYoutube(bot: Client, youTube: string){
    if(voiceConnection === null){
       await getConnection(bot);
    }
    voiceConnection.play(ytdl(youTube, {quality: 'highestaudio'}), {volume: 0.1})
        .on("finish", () => {
                voiceConnection.disconnect();
                voiceConnection == null;
            })
        .on("error", error => {
            console.error(error);
            voiceConnection.disconnect();
            voiceConnection = null;
        });
}

async function getConnection(bot : Client){
     const channel  = <VoiceChannel> await bot.channels.fetch(VOICE_CHANNEL_ID);
     voiceConnection = await channel.join();
}