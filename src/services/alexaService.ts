import { GuildChannel, Snowflake, VoiceState } from "discord.js";

import fetch from 'node-fetch';
import bot, {whosOnline, getChannelNameFromId} from './discordLogIn';

const NOTIFY_ME_KEY = process.env.NOTIFY_ME_KEY;
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const THE_FOREST_ID = process.env.THE_FOREST_ID;
const maxResendTime: number = 1000 * 60 * 60 * 6; //6hours

const urlBase = 'https://api.notifymyecho.com/v1/NotifyMe';
let lastSent: number | null = null;

bot.on('voiceStateUpdate', (oldState, newState) =>{
    setTimeout(() => checkIfSateIsSame(newState), 1000 * 60 * 5);
});

export async function getAndRespondWhosOnline(channelId?: Snowflake){
    const channelIdToUse = channelId == null ? VOICE_CHANNEL_ID : channelId;
    const users =  await whosOnline(channelIdToUse);
    let notification = `users online are ${users}`;
    if(users.length == 0){
        notification = 'no one is online';
    }
    if(channelId != null){
        const channelName =  await getChannelNameFromId(channelId);
        notification += ` on channel ${channelName}`;
    }
    const body = {
         "notification": notification,
         "accessCode": NOTIFY_ME_KEY
       };
    fetch(urlBase, {
                method: 'post',
                body:    JSON.stringify(body),
                headers: { 'Content-Type': 'application/json' },
            })
            .then(res => res.json())
            .then(console.log)
            .catch(err => console.log(err));
            console.log(`sent message: ${notification}`);
}

async function checkToSendWhosOnline(channelId: Snowflake){
 const users = await whosOnline(channelId != null ? channelId : VOICE_CHANNEL_ID);
 if(!users.includes('sleepingtree') && (lastSent == null || lastSent + maxResendTime < Date.now())){
    lastSent = Date.now();
    return getAndRespondWhosOnline(channelId)
        .then(() => true)
        .catch(err => console.log(err));
 }else{
    console.log('false');
    return false;
 }
}

async function checkIfSateIsSame(oldState: VoiceState){
    if(oldState.channelID && oldState.guild !=null && oldState.guild.id == THE_FOREST_ID){
        const channel = await bot.channels.fetch(oldState.channelID);
        if(channel instanceof GuildChannel){
            if(oldState.member){
                if(channel.members.has(oldState.member.id)){
                    checkToSendWhosOnline(oldState.channelID);
                  }
            }
        }else{
            console.warn(`Channel ${oldState.channelID} is not a voice channel`);
        }
    }
}
