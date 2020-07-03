const Discord = require('discord.js');
const bot = new Discord.Client();
const gameServices = require('./gameService');
const TOKEN = process.env.DISCORD_BOT_KEY;
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const VOICE_CHANNEL_ALT_ID = process.env.ALT_GENERAL_VOICE_CHANNEL;
const TEXT_CHANNEL_ID = process.env.GENERAL_TEXT_CHANNEL;

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
    msg.channel.send('pong');

  } else if (msg.content.startsWith('test')) {
    bot.channels.fetch(VOICE_CHANNEL_ID)
    .then(channel => {
        console.log('Channel name ');
        bot.users.fetch(msg.author.id)
        .then(user => {
            for(let activityId in user.presence.activities){
                let activity = user.presence.activities[activityId];
                msg.channel.send(`You are ${activity.type} on ${activity.name}`);
             }
        });
        console.log(channel.members)
    });
  } else if (msg.content.startsWith('!startGame')) {
    gameServices.startGame(bot, msg);
  } else if (msg.content.startsWith('!gameStart')) {
    msg.channel.send(`It's !startGame ... バカ...`);
  }else if (msg.content.startsWith('!cancelGame')) {
    gameServices.endGame(bot, msg);
  }else if (msg.content.startsWith('!redWins')) {
       gameServices.endGame(bot, msg, true);
  }else if (msg.content.startsWith('!blueWins')) {
      gameServices.endGame(bot, msg, false);
  }else if (msg.content.startsWith('!kick')) {
    if (msg.mentions.users.size) {
      const taggedUser = msg.mentions.users.first();
      msg.channel.send(`You wanted to kick: ${taggedUser.username}`);
    }else {
      msg.reply('Please tag a valid user!');
    }
  }
});



function whosOnline(channelId){
    bot.channels.fetch(channelId)
        .then(channel => {
            if(channel != null && channel.members != null){
                channel.members
                    .each(member => bot.users.fetch(member.id)
                        .then(user => {
                            console.log(user.presence);
                            for(let activityId in user.presence.activities){
                                console.log(user.presence.activities[activityId]);
                             }
                        })
                    );
            }
        })
        .catch(err => {
            console.log('shit ');
            console.log(err);
        });
}

exports.whosOnline = whosOnline;