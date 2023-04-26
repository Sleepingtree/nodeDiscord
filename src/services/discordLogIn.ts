import discord, { ActivityOptions, ActivityType, BaseGuildTextChannel, BaseGuildVoiceChannel, GuildChannel, Message, Partials, Snowflake } from 'discord.js';
import fs from 'fs';
import { Presence } from 'discord.js';
import BotStatusEmitter from '../model/botStatusEmitter';
import BotStatus from '../model/botStatus';
import throwIfNull from '../util/throwIfUndefinedOrNull';

const bot = new discord.Client({
  //idk man calc that shit
  intents: 14227,
  partials: [Partials.Channel]
});

export const botStatusEmitter = new BotStatusEmitter();

const deletedMessageFile = 'deletedMessageFile.json';
const TOKEN = process.env.DISCORD_BOT_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
const THE_FOREST_ID = process.env.THE_FOREST_ID ?? throwIfNull('Discord server ID is undefined');

const WHISS_USER_ID = process.env.WHISS_USER_ID;

export const BOT_PREFIX = '!'

const commands = [BOT_PREFIX + 'play', `${BOT_PREFIX}skip`, `${BOT_PREFIX}remove %number%`, `${BOT_PREFIX}queue`, `${BOT_PREFIX}pause`, `${BOT_PREFIX}clearQueue`, `${BOT_PREFIX}join`];

bot.login(TOKEN);

bot.on('ready', () => {
  console.info(`Logged in as ${bot.user?.tag}!`);
});

bot.on('messageCreate', msg => {
  if (msg.content === 'ping') {
    console.log('ping');
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

bot.on('messageDelete', async message => {
  console.log('in delete');
  const file = await fs.promises.readFile(deletedMessageFile, 'utf8');
  const jsonFile = JSON.parse(file);
  jsonFile[message.id] = message;
  const fileString = JSON.stringify(jsonFile, null, 2);
  const reply = `Message from ${message.member?.user.username} was deleted message was: \`${message.content}\` `;
  if (WHISS_USER_ID) {
    const whiss = await bot.users.fetch(WHISS_USER_ID)
    whiss.send(reply);
    fs.promises.writeFile(deletedMessageFile, fileString);
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
  const channels = await theForrest.channels.fetch();
  channels
    .filter(channel => typeof channelId === 'undefined' || channel?.id === channelId)
    .forEach(channel => {
      if (channel instanceof BaseGuildVoiceChannel) {
        channel.members.forEach(member => usersOnline.push(member.user.username))
      }
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

export function getBotStatus<T extends Presence>(botStatus?: T): BotStatusOrUndefined<T> {
  const botUser = bot.user;
  if (!botUser) {
    return undefined as BotStatusOrUndefined<T>;
  } else {
    const activity = botStatus ? botStatus.activities[0] : botUser.presence.activities[0];
    if (activity) {
      if (activity.type === ActivityType.Custom) {
        return {
          message: `${botUser.username}'s status is: ${activity.name}`,
          avatarURL: `${botUser.avatarURL()}`
        } as BotStatusOrUndefined<T>
      } else {
        return {
          message: `${botUser.username} is ${activity.type.toString().toLowerCase()}${addedWordToBotStatus(activity.type)}${activity.name}`,
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
    case ActivityType.Listening:
      return ' to ';
    case ActivityType.Competing:
      return ' in ';
    default:
      return ' ';
  }
}

function treeDisplayType(activityType: ActivityType) {
  switch (activityType) {
    case ActivityType.Custom:
      return '';
    default:
      return activityType.toString().toLocaleLowerCase().replace('ing', '');
  }
}

export function updateBotStatus(status?: string, options?: ActivityOptions) {
  let botStatus: Presence | undefined;
  if (status) {
    console.log(`Updating bot status to ${status}`);
  }
  if (status) {
    botStatus = bot.user?.setActivity(status, options);
  } else {
    botStatus = bot.user?.setActivity();
  }
  if (botStatus) {
    botStatusEmitter.emit('botStatusChange', getBotStatus(botStatus));
  }
}

export async function postMessageInChannel(message: string, channelName: string) {
  const theForest = await bot.guilds.fetch(THE_FOREST_ID);
  const channel = theForest.channels.cache
    .filter(channel => channel.name.replace('-', ' ').toLowerCase() === channelName)
    .first();
  if (channel instanceof BaseGuildTextChannel) {
    channel.send(message);
  }
}

bot.on('presenceUpdate', (oldSatus, newStatus) => {
  //Check if the user is me, and if there is a real staus change
  if (newStatus.member?.id === TREE_USER_ID && newStatus.activities !== oldSatus?.activities) {
    const botStatus = bot.user?.presence.activities[0];
    if (!botStatus || botStatus.type === ActivityType.Watching) {
      const treeStatus = newStatus.activities[0];
      if (treeStatus) {
        let statusMessage = `Tree ${treeDisplayType(treeStatus.type)}${addedWordToBotStatus(treeStatus.type)}`;
        if (treeStatus.details) {
          statusMessage += `${treeStatus.details}`;
        } else if (treeStatus.state) {
          statusMessage += `${treeStatus.state}`;
        } else {
          statusMessage += `${treeStatus.name}`;
        }
        updateBotStatus(statusMessage, { type: ActivityType.Watching });
      } else {
        updateBotStatus();
      }
    }
  }
});

export default bot;