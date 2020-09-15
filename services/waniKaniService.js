const fetch = require('node-fetch');
const WANIKANI_API_KEY = process.env.WANIKANI_API_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
let lastSummery = null;
let reviewMessageSent = true;
const checkWaniKaniInterval = 1000 * 60;

function getSummery(){
    const url = "https://api.wanikani.com/v2/summary";
    fetch(url, {
            method: 'get',
            headers: { 'Authorization': `Bearer ${WANIKANI_API_KEY}` },
        })
          .then(res => res.json())
          .then(response => lastSummery = response)
          .catch(err => console.log(err));

}

setInterval(() => getSummery(), checkWaniKaniInterval);

function getReviewCount(){
  return lastSummery == null ? 0 : lastSummery.data.reviews[0].subject_ids.length;
}

function checkReviewCount(bot){
  let reviewCount = getReviewCount();
  if(reviewCount > 0 && !reviewMessageSent && bot != null){
    sendReviewcount(bot);
  }else if(reviewCount == 0){
    reviewMessageSent = false;
  }

}

function sendReviewcount(bot){
 let reviewCount = getReviewCount();
 let message = null;
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

exports.getSummery = getSummery;
exports.sendReviewcount = sendReviewcount;
exports.checkReviewCount = checkReviewCount;