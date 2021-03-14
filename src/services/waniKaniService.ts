import fetch from 'node-fetch';
import WaniKaniSummary from '../model/WaniKaniSummary';
import bot from './discordLogIn';
import {BOT_PREFIX} from './discordLogIn';

const WANIKANI_API_KEY = process.env.WANIKANI_API_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
let lastSummery: WaniKaniSummary = null;
let reviewMessageSent: boolean = true;
const checkWaniKaniInterval = 1000 * 60;

bot.on('message', msg => {
  if(msg.content.startsWith(BOT_PREFIX + 'wani')) {
    sendReviewcount();
  }
});

async function getSummery(){
    const url = "https://api.wanikani.com/v2/summary";
    let res = await fetch(url, {
            method: 'get',
            headers: { 'Authorization': `Bearer ${WANIKANI_API_KEY}` },
        });
    lastSummery = <WaniKaniSummary> await res.json();
}

function getReviewCount(){
  return lastSummery == null ? null : lastSummery.data.reviews[0].subject_ids.length;
}

async function checkReviewCount(){
  await getSummery();
  if(getReviewCount() > 0){
    sendReviewcount();
  }else{
    reviewMessageSent = false;
  }
}

function sendReviewcount(){
 let reviewCount: number = getReviewCount();
 let message: string = null;
 if(reviewCount > 0){
    reviewMessageSent = true;
    let addS = reviewCount > 1 ? 's' : '';
    message = `You have ${reviewCount} review${addS} to do! がんばって`;
 }else{
    reviewMessageSent = false;
    message = `何もない`;
 }
 bot.users.fetch(TREE_USER_ID).then(user => user.send(message));
}

setInterval(() => checkReviewCount(), checkWaniKaniInterval);