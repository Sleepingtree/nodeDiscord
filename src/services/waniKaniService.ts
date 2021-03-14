import { Client } from 'discord.js';
import fetch from 'node-fetch';
import {WaniKaniSummary} from '../model/WaniKaniSummary';
const WANIKANI_API_KEY = process.env.WANIKANI_API_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
let lastSummery: WaniKaniSummary = null;
let reviewMessageSent: boolean = true;
const checkWaniKaniInterval = 1000 * 60;

function getSummery(){
    const url = "https://api.wanikani.com/v2/summary";
    fetch(url, {
            method: 'get',
            headers: { 'Authorization': `Bearer ${WANIKANI_API_KEY}` },
        })
          .then(res => res.json())
          .then(response => lastSummery = <WaniKaniSummary>response)
          .catch(err => console.log(err));

}

setInterval(() => getSummery(), checkWaniKaniInterval);

export function getReviewCount(){
  return <number> (lastSummery == null ? 0 : lastSummery.data.reviews[0].subject_ids.length);
}

export function checkReviewCount(bot: Client){
  let reviewCount = getReviewCount();
  if(reviewCount > 0 && !reviewMessageSent && bot != null){
    sendReviewcount(bot);
  }else if(reviewCount == 0 && lastSummery != null){
    reviewMessageSent = false;
  }

}

export function sendReviewcount(bot: Client){
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