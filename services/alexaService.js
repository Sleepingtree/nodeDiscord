const fetch = require('node-fetch');
const discordLogin = require('./discordLogIn');
const NOTIFY_ME_KEY = process.env.NOTIFY_ME_KEY;
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const maxResendTime = 1000 * 60 * 60 * 20; //20 hours

const urlBase = 'https://api.notifymyecho.com/v1/NotifyMe';
let lastSent = null;

async function getAndRespondWhosOnline(channelId){
    const channelIdToUse = channelId == null ? VOICE_CHANNEL_ID : channelId;
    const users =  await discordLogin.whosOnline(channelIdToUse);
    let notification = `users online are ${users}`;
    if(users.length == 0){
        notification = 'no one is online';
    }
    if(channelId != null){
        const channelName =  await discordLogin.getChannelNameFromId(channelId);
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

async function checkToSendWhosOnline(channelId){
 const users = await discordLogin.whosOnline(VOICE_CHANNEL_ID);
 if(!users.includes('sleepingtree') && (lastSent == null || (lastSent.getTime() + maxResendTime<  Date.now().getTime()))){
    return false;
 }else{
    return getAndRespondWhosOnline(channelId)
    .then(data => true)
    .catch(err => console.log(err));
 }
}

exports.getAndRespondWhosOnline = getAndRespondWhosOnline;
exports.checkToSendWhosOnline = checkToSendWhosOnline;