const fetch = require('node-fetch');

const blueTeamEmoji = '🔵';
const redTeamEmoji = '🔴';
const draftWait = 60000;

async function createDraftPost(bot, msg){
    const responseMsg = 'Waiting for captains, click which captain you want to be.'
    const post = await msg.channel.send(responseMsg);
    //blue
    post.react(blueTeamEmoji);
    //red
    post.react(redTeamEmoji);
    const urls =  draft(null);
    console.log(urls);
    const redFilter = (reaction, user) => {
    	return [redTeamEmoji].includes(reaction.emoji.name) && user.id != post.author.id;
    };
    const blueFilter = (reaction, user) => {
        return [blueTeamEmoji].includes(reaction.emoji.name) && user.id != post.author.id;
    };

    const bluePromise = sendLink(post, blueFilter);
    const redPromise = sendLink(post, redFilter);

    Promise.all([redPromise, bluePromise, urls]).then((values) => {
      handleCaptianPromise(values[0], post, values[2][1], bot);
      handleCaptianPromise(values[1], post, values[2][0], bot);
      msg.channel.send("Draft link: " + values[2][2]);
    });
    post.delete({timeout: draftWait});
}

function sendLink(post, filter){
  return post.awaitReactions(filter, { max: 1, time: draftWait, errors: ['time'] });
}

function handleCaptianPromise(collection, post, url, bot){
  const reaction = collection.first();
  const teamCaptaianId = reaction.users.cache.filter(user => user.id != post.author.id).values().next().value.id;
  bot.users.fetch(teamCaptaianId).then(user => user.send("Draft link:" + url));
}

async function draft(msg){
    const body = {"team1Name":"blue","team2Name":"red","matchName":"match"};
    console.log(JSON.stringify(body));
    const response = await fetch('http://prodraft.leagueoflegends.com/draft', {
            method: 'post',
            body:    JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(res => res.json());
        console.log(response);
        const ids = [response.auth[0], response.auth[1], response.id];
        let urls = [];
        //blue team
        urls.push('http://prodraft.leagueoflegends.com/?draft=' + response.id + '&auth=' + response.auth[0] +'&locale=en_US');
        //red team
        urls.push('http://prodraft.leagueoflegends.com/?draft=' + response.id + '&auth=' + response.auth[1] +'&locale=en_US');
        //spectator
        urls.push('http://prodraft.leagueoflegends.com/?draft=' + response.id +'&locale=en_US');
        if(msg != null){
          msg.channel.send(urls);
        }
    return urls;
}

exports.createDraftPost = createDraftPost;