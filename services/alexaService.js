const fetch = require('node-fetch');
const discordLogin = require('./discordLogIn');
const NOTIFY_ME_KEY = process.env.NOTIFY_ME_KEY;
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;

const urlBase = 'https://api.notifymyecho.com/v1/NotifyMe';

async function getAndRespondWhosOnline(){
    const users =  await discordLogin.whosOnline(VOICE_CHANNEL_ID);
    let notification = `users online are ${users}`;
    if(users.length == 0){
        notification = 'no one is online';
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

exports.getAndRespondWhosOnline = getAndRespondWhosOnline;