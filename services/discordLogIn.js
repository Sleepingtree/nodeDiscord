const Discord = require('discord.js');
const fs = require('fs');
const bot = new Discord.Client();
const gameServices = require('./gameService');
const clashService = require('./clashPlaningService');
const draftService = require('./draftService');
const discordRoleService = require('./discordRoleService');
const waniKaniService = require('./waniKaniService');
const alexaService = require('./alexaService');

const deletedMessageFile = 'deletedMessageFile.json';
const checkUserInterval = 1000 * 60 * 5;
const checkWaniKaniInterval = 1000 * 60;
const TOKEN = process.env.DISCORD_BOT_KEY;
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const VOICE_CHANNEL_ALT_ID = process.env.ALT_GENERAL_VOICE_CHANNEL;
const TEXT_CHANNEL_ID = process.env.GENERAL_TEXT_CHANNEL;
const THE_FOREST_ID = process.env.THE_FOREST_ID;

const BOT_PREFIX = '!'
const commands = [ BOT_PREFIX + 'startGame', BOT_PREFIX + 'cancelGame', BOT_PREFIX + 'redWins', BOT_PREFIX + 'blueWins',
    BOT_PREFIX + 'mmr', BOT_PREFIX + 'map',  BOT_PREFIX + 'join', BOT_PREFIX + 'roles'];

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
    msg.channel.send('pong');

  } else if (msg.content.startsWith(BOT_PREFIX + 'startGame')) {
    gameServices.startGame(bot, msg);
  } else if (msg.content.startsWith(BOT_PREFIX + 'gameStart')) {
    msg.channel.send("It's " + BOT_PREFIX + 'startGame ... バカ...');
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
  }else if (msg.content.startsWith(BOT_PREFIX + 'draft')) {
    draftService.createDraftPost(bot, msg);
  }else if (msg.content.startsWith(BOT_PREFIX + 'clashMessage')) {
    clashService.addClashTime(bot, msg);
  }else if (msg.content.startsWith(BOT_PREFIX + 'roles')) {
    const joinCommand = BOT_PREFIX + 'join -';
    discordRoleService.listRoles(bot, msg, joinCommand);
  }else if (msg.content.startsWith(BOT_PREFIX + 'join')) {
    discordRoleService.joinRole(bot, msg);
  }else if (msg.content.startsWith(BOT_PREFIX + 'wani')) {
    waniKaniService.sendReviewcount(bot);
  }else if (msg.content.startsWith(BOT_PREFIX + 'help')) {
    let message = 'use the following commands or ask Tree for help: \r\n\r\n';
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

bot.on('voiceStateUpdate', (oldState, newState) =>{
    setTimeout(() => checkIfSateIsSame(newState), 1000 * 60 * 5);
});

bot.on('messageDelete', message => {
    console.log('in delete');
    let file = fs.readFileSync(deletedMessageFile, 'utf8');
    let jsonFile = JSON.parse(file);
    jsonFile[message.id] = message
    const fileString = JSON.stringify(jsonFile, null, 2);
    fs.writeFileSync(deletedMessageFile, fileString);
});

function checkIfSateIsSame(oldState){
    if(oldState.guild.id == THE_FOREST_ID){
        bot.channels.fetch(oldState.channelID)
            .then(channel => {
                if(channel.members.has(oldState.member.id)){
                  alexaService.checkToSendWhosOnline(oldState.channelID);
                }
            });
    }
}

async function getChannelNameFromId(channelId){
  return await bot.channels.fetch(channelId)
    .then(channel => channel.name);

}

async function whosOnline(channelId){
    let usersOnline = new Array();
    await bot.channels.fetch(channelId)
        .then(channel => {
            if(channel != null && channel.members != null){
                channel.members
                    .each(member => bot.users.fetch(member.id)
                        .then(user => {
                            usersOnline.push(user.username);
                        })
                    );
            }
        })
        .catch(err => {
            console.log(err);
        });
        return usersOnline;
}


setInterval(() => waniKaniService.checkReviewCount(bot), checkWaniKaniInterval);

exports.whosOnline = whosOnline;
exports.getChannelNameFromId = getChannelNameFromId;