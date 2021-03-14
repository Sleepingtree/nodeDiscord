import { Snowflake } from "discord.js";

import fetch from 'node-fetch';
import {whosOnline, getChannelNameFromId} from './discordLogIn';
const NOTIFY_ME_KEY = process.env.NOTIFY_ME_KEY;
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const maxResendTime: number = 1000 * 60 * 60 * 6; //6hours

const urlBase = 'https://api.notifymyecho.com/v1/NotifyMe';
let lastSent: number = null;

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

export async function checkToSendWhosOnline(channelId: Snowflake){
 const users = await whosOnline(channelId != null ? channelId : VOICE_CHANNEL_ID);
 if(!users.includes('sleepingtree') && (lastSent == null || lastSent + maxResendTime < Date.now())){
    lastSent = Date.now();
    return getAndRespondWhosOnline(channelId)
        .then(data => true)
        .catch(err => console.log(err));
 }else{
    console.log('false');
    return false;
 }
}
