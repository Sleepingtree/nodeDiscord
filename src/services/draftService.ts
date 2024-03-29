import { Client, Collection, CollectorFilter, Message, MessageReaction, User } from "discord.js";

import bot, { BOT_PREFIX } from './discordLogIn';

const blueTeamEmoji = '🔵';
const redTeamEmoji = '🔴';
const draftWait = 60000;

bot.on('messageCreate', msg => {
  if (msg.content.startsWith(BOT_PREFIX + 'draft')) {
    createDraftPost(msg)
  }
});

async function createDraftPost(msg: Message) {
  const responseMsg = 'Waiting for captains, click which captain you want to be.'
  const post = await msg.channel.send(responseMsg);
  //blue
  post.react(blueTeamEmoji);
  //red
  post.react(redTeamEmoji);
  const urls = draft();
  console.log(urls);
  const redFilter = (reaction: MessageReaction, user: User) => {
    return redTeamEmoji === reaction.emoji.name && user.id != post.author.id;
  };
  const blueFilter = (reaction: MessageReaction, user: User) => {
    return blueTeamEmoji === reaction.emoji.name && user.id != post.author.id;
  };

  const bluePromise = sendLink(post, blueFilter);
  const redPromise = sendLink(post, redFilter);

  Promise.all([redPromise, bluePromise, urls]).then((values) => {
    handleCaptianPromise(values[0], post, values[2][1], bot);
    handleCaptianPromise(values[1], post, values[2][0], bot);
    msg.channel.send("Draft link: " + values[2][2]);
  });
  setTimeout(post.delete, draftWait);
}

function sendLink(post: Message, filter: CollectorFilter<[MessageReaction, User]>) {
  return post.awaitReactions({ filter: filter, max: 1, time: draftWait, errors: ['time'] });
}

function handleCaptianPromise(collection: Collection<string, MessageReaction>, post: Message, url: String, bot: Client) {
  const reaction = collection.first();
  const teamCaptaianId = reaction?.users.cache.filter(user => user.id != post.author.id).values().next().value.id;
  bot.users.fetch(teamCaptaianId).then(user => user.send("Draft link:" + url));
}

async function draft() {
  const body = { "team1Name": "blue", "team2Name": "red", "matchName": "match" };
  console.log(JSON.stringify(body));
  const response = await fetch('http://prodraft.leagueoflegends.com/draft', {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
    .then(res => res.json());
  console.log(response);

  let urls: Array<String> = [];
  //blue team
  urls.push('http://prodraft.leagueoflegends.com/?draft=' + response.id + '&auth=' + response.auth[0] + '&locale=en_US');
  //red team
  urls.push('http://prodraft.leagueoflegends.com/?draft=' + response.id + '&auth=' + response.auth[1] + '&locale=en_US');
  //spectator
  urls.push('http://prodraft.leagueoflegends.com/?draft=' + response.id + '&locale=en_US');
  return urls;
}