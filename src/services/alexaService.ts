import { GuildChannel, Snowflake, VoiceState } from "discord.js";

import bot, { whosOnline, getChannelNameFromId } from './discordLogIn';
import { getRuntimeConfig } from "./dbServiceAdapter";
import { GeneralVoiceChannel, NotifyMe, TheForest } from "../model/runtimeConfig";


const maxResendTime = 1000 * 60 * 60 * 6; //6hours

const urlBase = 'https://api.notifymyecho.com/v1/NotifyMe';
let lastSent: number | null = null;

bot.on('voiceStateUpdate', (_oldState, newState) => {
    setTimeout(() => checkIfSateIsSame(newState), 1000 * 60 * 5);
});

export async function getAndRespondWhosOnline(channelId?: Snowflake) {
    const { value: voiceChannelId } = await getRuntimeConfig(GeneralVoiceChannel)
    const { apiKey } = await getRuntimeConfig(NotifyMe)
    const channelIdToUse = channelId == null ? voiceChannelId : channelId;
    const users = await whosOnline(channelIdToUse);
    let notification = `users online are ${users}`;
    if (users.length == 0) {
        notification = 'no one is online';
    }
    if (channelId != null) {
        const channelName = await getChannelNameFromId(channelId);
        notification += ` on channel ${channelName}`;
    }
    const body = {
        "notification": notification,
        "accessCode": apiKey
    };
    fetch(urlBase, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => res.json())
        .then(console.log)
        .catch(err => console.log(err));
    console.log(`sent message: ${notification}`);
}

async function checkToSendWhosOnline(channelId: Snowflake) {
    const { value: voiceChannelId } = await getRuntimeConfig(GeneralVoiceChannel)
    const users = await whosOnline(channelId != null ? channelId : voiceChannelId);
    if (!users.includes('sleepingtree') && (lastSent == null || lastSent + maxResendTime < Date.now())) {
        lastSent = Date.now();
        return getAndRespondWhosOnline(channelId)
            .then(() => true)
            .catch(err => console.log(err));
    } else {
        console.log('false');
        return false;
    }
}

async function checkIfSateIsSame(oldState: VoiceState) {
    const { value: theForestId } = await getRuntimeConfig(TheForest)
    if (oldState.channelId && oldState.guild != null && oldState.guild.id == theForestId) {
        const channel = await bot.channels.fetch(oldState.channelId);
        if (channel instanceof GuildChannel) {
            if (oldState.member) {
                if (channel.members.has(oldState.member.id)) {
                    checkToSendWhosOnline(oldState.channelId);
                }
            }
        } else {
            console.warn(`Channel ${oldState.channelId} is not a voice channel`);
        }
    }
}
