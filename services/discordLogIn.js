const Discord = require('discord.js');
const bot = new Discord.Client();
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
     console.log(channel.members)
    });
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
        console.log('Channel name ');
         console.log(channel.members)
        });
}

exports.whosOnline = whosOnline;