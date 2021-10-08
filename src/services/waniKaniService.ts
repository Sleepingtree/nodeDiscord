import fetch from 'node-fetch';
import WaniKaniSummary from '../model/waniKaniSummary';
import bot, { BOT_PREFIX } from './discordLogIn';

const WANIKANI_API_KEY = process.env.WANIKANI_API_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
let lastSummery: WaniKaniSummary | undefined;
let reviewMessageSent: boolean = true;
const checkWaniKaniInterval = 1000 * 60;

bot.on('messageCreate', msg => {
  if (msg.content.startsWith(BOT_PREFIX + 'wani')) {
    sendReviewcount();
  }
});

async function getSummery() {
  const url = "https://api.wanikani.com/v2/summary";
  let res = await fetch(url, {
    method: 'get',
    headers: { 'Authorization': `Bearer ${WANIKANI_API_KEY}` },
  });
  const summery = await res.json() as WaniKaniSummary;
  if (summery) {
    lastSummery = summery;
  }
}

function getReviewCount() {
  return lastSummery?.data.reviews[0].subject_ids.length;
}

async function checkReviewCount() {
  await getSummery();
  const reviewCount = getReviewCount();
  if (reviewCount && reviewCount > 0 && !reviewMessageSent) {
    sendReviewcount();
  } else if (reviewCount == 0) {
    reviewMessageSent = false;
  }
}

function sendReviewcount() {
  let reviewCount = getReviewCount();
  let message: string;
  if (reviewCount && reviewCount > 0) {
    reviewMessageSent = true;
    let addS = reviewCount > 1 ? 's' : '';
    message = `You have ${reviewCount} review${addS} to do! がんばって`;
  } else {
    reviewMessageSent = false;
    message = `何もない`;
  }
  if (TREE_USER_ID) {
    bot.users.fetch(TREE_USER_ID).then(user => user.send(message));
  }
}

setInterval(() => checkReviewCount(), checkWaniKaniInterval);