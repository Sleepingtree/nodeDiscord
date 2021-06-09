import Discord, { ActivityOptions, ActivityType, GuildChannel, Message, Snowflake, TextChannel } from 'discord.js';
import fs from 'fs';
import { Presence } from 'discord.js';

import BotStatusEmitter from '../model/botStatusEmitter';
import BotStatus from '../model/botStatus';
import throwIfNull from '../util/throwIfUndefinedOrNull';

const bot = new Discord.Client();

export const botStatusEmitter = new BotStatusEmitter();

const deletedMessageFile = 'deletedMessageFile.json';
const TOKEN = process.env.DISCORD_BOT_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
const THE_FOREST_ID = process.env.THE_FOREST_ID ?? throwIfNull('Discord server ID is undefined');

const WHISS_USER_ID = process.env.WHISS_USER_ID;

export const BOT_PREFIX = '!'

const commands = [BOT_PREFIX + 'startGame', BOT_PREFIX + 'cancelGame', BOT_PREFIX + 'redWins', BOT_PREFIX + 'blueWins',
BOT_PREFIX + 'mmr', BOT_PREFIX + 'map', BOT_PREFIX + 'join', BOT_PREFIX + 'roles', BOT_PREFIX + 'okite'];

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user?.tag}!`);
});

bot.on('message', msg => {
  if (msg.content === 'ping') {
    msg.reply('pong');
    msg.channel.send('pong');
  } else if (msg.content.startsWith(BOT_PREFIX + 'whoIs')) {
    whoIs(msg);
  } else if (msg.content.startsWith(BOT_PREFIX + 'help')) {
    let message = 'use the following commands or ask Tree for help: \r\n\r\n';
    commands.forEach(command => message += command + '\r\n');
    msg.channel.send(message);
  }
});

bot.on('messageDelete', message => {
  console.log('in delete');
  const file = fs.readFileSync(deletedMessageFile, 'utf8');
  const jsonFile = JSON.parse(file);
  jsonFile[message.id] = message;
  const fileString = JSON.stringify(jsonFile, null, 2);
  const reply = `Message from ${message.member?.user.username} was deleted message was: \`${message.content}\` `;
  if (WHISS_USER_ID) {
    bot.users.fetch(WHISS_USER_ID)
      .then(user => user.send(reply))
      .catch(console.log);
    fs.writeFileSync(deletedMessageFile, fileString);
  }
});

export async function getChannelNameFromId(channelId: Snowflake) {
  return await bot.channels.fetch(channelId)
    .then(channel => (<GuildChannel>channel).name)
    .catch(console.log);

}

export async function whosOnline(channelId?: Snowflake) {
  let usersOnline: string[] = [];
  const theForrest = await bot.guilds.fetch(THE_FOREST_ID);
  theForrest.channels.cache
    .filter(channel => channel.type === 'voice')
    .filter(channel => !channelId || channel.id === channelId)
    .forEach(channel => {
      channel.members.forEach(member => usersOnline.push(member.user.username))
    });
  return usersOnline;
}

export function whoIs(msg: Message) {
  if (msg.author.id == TREE_USER_ID) {
    const id = msg.content.split(" ")[1];
    const userPromise = bot.users.fetch(id);
    userPromise.then(user => {
      if (user != null) {
        msg.channel.send(user.username);
      } else {
        msg.channel.send("誰もいない");
      }
    });
  }
}

type BotStatusOrUndefined<T extends BotStatus | Presence | undefined | null> = T extends undefined | null ? undefined : BotStatus;

export function getBotStatus<T extends Presence | undefined>(botStatus?: T): BotStatusOrUndefined<T> {
  const botUser = bot.user;
  if (!botUser) {
    return undefined as BotStatusOrUndefined<T>;
  } else {
    const activity = botStatus ? botStatus.activities[0] : botUser.presence.activities[0];
    if (activity) {
      if (activity.type === 'CUSTOM_STATUS') {
        return {
          message: `${botUser.username}'s status is: ${activity.name}`,
          avatarURL: `${botUser.avatarURL()}`
        } as BotStatusOrUndefined<T>
      } else {
        return {
          message: `${botUser.username} is ${activity.type.toLowerCase()} ${addedWordToBotStatus(activity.type)}${activity.name}`,
          avatarURL: `${botUser.avatarURL()}`
        } as BotStatusOrUndefined<T>
      }
    } else {
      return {
        message: `${botUser.username} is not doing anything`,
        avatarURL: `${botUser.avatarURL()}`
      } as BotStatusOrUndefined<T>
    }
  }
}

function addedWordToBotStatus(activityType: ActivityType) {
  switch (activityType) {
    case 'LISTENING':
      return 'to ';
    case 'COMPETING':
      return 'in ';
    default:
      return ' ';
  }
}

function treeDisplayType(activityType: ActivityType) {
  switch (activityType) {
    case 'CUSTOM_STATUS':
      return ''
    default:
      return activityType.toLocaleLowerCase().replace('ing', '');
  }
}

export async function updateBotStatus(status?: string, options?: ActivityOptions) {
  let botStatus: Presence | undefined;
  console.log(`Updating bot status to  ${status}`);
  if (status) {
    botStatus = await bot.user?.setActivity(status, options);
  } else {
    botStatus = await bot.user?.setActivity(options);
  }
  if (botStatus) {
    botStatusEmitter.emit('botStatusChange', getBotStatus(botStatus));
  }
}

export async function postMessageInChannel(message: string, channelName: string){
  const theForest = await bot.guilds.fetch(THE_FOREST_ID);
  const channel = theForest.channels.cache
    .filter(channel => channel.name === channelName)
    .first();
  const canPost = channel?.isText();
  if(canPost){
    (channel as TextChannel).send(message);
  }
}

bot.on('presenceUpdate', (oldSatus: Presence | undefined, newStatus: Presence) => {
  //Check if the user is me, and if there is a real staus change
  if (newStatus.userID === TREE_USER_ID && newStatus.activities !== oldSatus?.activities) {
    const botStatus = bot.user?.presence.activities[0];
    if (!botStatus || botStatus.type === 'WATCHING') {
      const treeStatus = newStatus.activities[0];
      if (treeStatus) {
        let statusMessage = `Tree ${treeDisplayType(treeStatus.type)} ${addedWordToBotStatus(treeStatus.type)}`;
        if (treeStatus.details) {
          statusMessage += `${treeStatus.details}`;
        } else if (treeStatus.state) {
          statusMessage += `${treeStatus.state}`;
        } else {
          statusMessage += `${treeStatus.name}`;
        }
        updateBotStatus(statusMessage, { type: 'WATCHING' });
      } else {
        updateBotStatus();
      }
    }
  }
});

export default bot;