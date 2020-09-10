const fetch = require('node-fetch');
const WANIKANI_API_KEY = process.env.WANIKANI_API_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
let lastSummery = null;
let reviewMessageSent = false;
const checkWaniKaniInterval = 1000 * 5;

async function getSummery(){
    const url = "https://api.wanikani.com/v2/summary";
    const response = await fetch(url, {
            method: 'get',
            headers: { 'Authorization': `Bearer ${WANIKANI_API_KEY}` },
        })
          .then(res => res.json());
    lastSummery = response;
}

setInterval(() => getSummery(), checkWaniKaniInterval);

function getReviewCount(){
  return lastSummery == null ? 0 : lastSummery.data.reviews[0].subject_ids.length;
}

function checkReviewCount(bot){
  let reviewCount = getReviewCount();
  console.log("in check review")
  if(reviewCount > 0 && !reviewMessageSent && bot != null){
    sendReviewcount(bot);
  }

}

function sendReviewcount(bot){
 let reviewCount = getReviewCount();
 let message = null;
 if(reviewCount > 0){
    reviewMessageSent = true;
    let addS = reviewCount>1 ? 's' : '';
    message = `You have ${reviewCount} review${addS} to do! がんばって`;
 }else{
    reviewMessageSent = false;
    message = `何もない`;
 }
 bot.users.fetch(TREE_USER_ID).then(user => user.send(message));
}

exports.getSummery = getSummery;
exports.getReviewCount = getReviewCount;
exports.checkReviewCount = checkReviewCount;