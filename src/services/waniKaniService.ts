import fetch, { FetchError } from 'node-fetch';
import { TreeUserId, Wanikani } from '../model/runtimeConfig';
import WaniKaniSummary from '../model/waniKaniSummary';
import { getRuntimeConfig } from './dbServiceAdapter';
import bot, { BOT_PREFIX } from './discordLogIn';

let lastSummery: WaniKaniSummary | undefined;
let reviewMessageSent = true;
const checkWaniKaniInterval = 1000 * 60;
const url = "https://api.wanikani.com/v2/summary";

bot.on('messageCreate', msg => {
  if (msg.content.startsWith(BOT_PREFIX + 'wani')) {
    sendReviewcount();
  }
});

async function getSummery() {
  const { apiKey } = await getRuntimeConfig(Wanikani)
  try {
    let res = await fetch(url, {
      method: 'get',
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    const summery = await res.json() as WaniKaniSummary;
    if (summery) {
      lastSummery = summery;
    }
  } catch (e) {
    if (e instanceof FetchError) {
      console.error(`Caught fetch error: ${e.code} ${e.message}`);
      console.log(`${e}`)
    } else {
      console.error(`Caught unhandled error ${e}`)
    }

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

async function sendReviewcount() {
  const { value: treeUserId } = await getRuntimeConfig(TreeUserId)
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
  if (treeUserId) {
    bot.users.fetch(treeUserId).then(user => user.send(message));
  }
}

setInterval(() => checkReviewCount(), checkWaniKaniInterval);