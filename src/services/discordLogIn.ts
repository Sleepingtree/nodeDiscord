import Discord, { GuildChannel, Snowflake, VoiceChannel, VoiceState } from 'discord.js';
import fs from 'fs';
const bot = new Discord.Client();
import * as gameServices from './gameService';
import * as clashService from './clashPlaningService';
import * as draftService from './draftService';
import * as discordRoleService from './discordRoleService';
import * as waniKaniService from './waniKaniService';
import * as alexaService from'./alexaService';
import * as youtubeService from './youtubeService';

const deletedMessageFile = 'deletedMessageFile.json';
const checkUserInterval = 1000 * 60 * 5;
const checkWaniKaniInterval = 1000 * 60;
const TOKEN = process.env.DISCORD_BOT_KEY;

const THE_FOREST_ID = process.env.THE_FOREST_ID;
const WHISS_USER_ID = process.env.WHISS_USER_ID;

const BOT_PREFIX = '!'
const commands = [ BOT_PREFIX + 'startGame', BOT_PREFIX + 'cancelGame', BOT_PREFIX + 'redWins', BOT_PREFIX + 'blueWins',
    BOT_PREFIX + 'mmr', BOT_PREFIX + 'map',  BOT_PREFIX + 'join', BOT_PREFIX + 'roles', BOT_PREFIX + 'okite'];

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
    gameServices.checkMmr(msg);
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
  }else if (msg.content.startsWith(BOT_PREFIX + 'okite')) {
    youtubeService.playYoutube(bot, 'https://www.youtube.com/watch?v=6QBw0FVlPiI');
  }else if (msg.content.startsWith(BOT_PREFIX + 'shitPost')) {
    youtubeService.playYoutube(bot, 'https://www.youtube.com/watch?v=fLaNJLZK21Y');
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
    const reply = `Message from ${message.member.user.username} was deleted message was: \`${message.content}\` `;
    bot.users.fetch(WHISS_USER_ID)
        .then(user => user.send(reply))
        .catch(console.log);
    fs.writeFileSync(deletedMessageFile, fileString);
});

function checkIfSateIsSame(oldState: VoiceState){
    if(oldState != null && oldState.guild !=null && oldState.guild.id == THE_FOREST_ID){
        bot.channels.fetch(oldState.channelID)
            .then(channel => {
                if((<GuildChannel>channel).members.has(oldState.member.id)){
                  alexaService.checkToSendWhosOnline(oldState.channelID);
                }
            }).catch(console.log);
    }
}

export async function getChannelNameFromId(channelId: Snowflake){
  return await bot.channels.fetch(channelId)
    .then(channel => (<GuildChannel>channel).name)
    .catch(console.log);

}

export async function whosOnline(channelId: Snowflake){
    let usersOnline = new Array();
    await bot.channels.fetch(channelId)
        .then(channel => {
          const guildChannel: GuildChannel = <GuildChannel>channel;
            if(channel != null && guildChannel.members != null){
              guildChannel.members
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
setInterval(() => discordRoleService.checkUsersInDisc(bot), checkUserInterval);