const Discord = require('discord.js');
const bot = new Discord.Client();
const gameServices = require('./gameService');
const clashService = require('./clashPlaningService');
const TOKEN = process.env.DISCORD_BOT_KEY;
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const VOICE_CHANNEL_ALT_ID = process.env.ALT_GENERAL_VOICE_CHANNEL;
const TEXT_CHANNEL_ID = process.env.GENERAL_TEXT_CHANNEL;

const BOT_PREFIX = '!'
const commands = [ BOT_PREFIX + 'startGame', BOT_PREFIX + 'cancelGame', BOT_PREFIX + 'redWins', BOT_PREFIX + 'blueWins', BOT_PREFIX + 'mmr', BOT_PREFIX + 'map'];

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
  } else if (msg.content.startsWith(BOT_PREFIX + 'startGame')) {
    gameServices.startGame(bot, msg);
  } else if (msg.content.startsWith(BOT_PREFIX + 'gameStart')) {
    msg.channel.send(`It's ' + BOT_PREFIX + 'startGame ... バカ...`);
  }else if (msg.content.startsWith(BOT_PREFIX + 'cancelGame')) {
    gameServices.endGame(bot, msg);
  }else if (msg.content.startsWith(BOT_PREFIX + 'redWins')) {
    gameServices.endGame(bot, msg, true);
  }else if (msg.content.startsWith(BOT_PREFIX + 'blueWins')) {
    gameServices.endGame(bot, msg, false);
  }else if (msg.content.startsWith(BOT_PREFIX + 'mmr')) {
    gameServices.checkMmr(bot, msg);
  }else if (msg.content.startsWith(BOT_PREFIX + 'map')) {
      gameServices.pickMap(msg);
  }else if (msg.content.startsWith(BOT_PREFIX + 'whoIs')) {
        gameServices.whoIs(bot, msg);
  }else if (msg.content.startsWith(BOT_PREFIX + 'clashMessage')) {
          clashService.addClashTime(bot, msg);
  }else if (msg.content.startsWith(BOT_PREFIX + 'help')) {
    let message = `use the following commands or ask Tree for help: \r\n\r\n`;
    commands.forEach(command => message += command + '\r\n');
    msg.channel.send(message);
  }else if (msg.content.startsWith(BOT_PREFIX + 'kick')) {
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