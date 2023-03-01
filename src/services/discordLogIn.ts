import discord, { ActivityOptions, ActivityType, GuildChannel, Intents, Message, Snowflake } from 'discord.js';
import fs from 'fs';
import { Presence } from 'discord.js';
import BotStatusEmitter from '../model/botStatusEmitter';
import BotStatus from '../model/botStatus';
import throwIfNull from '../util/throwIfUndefinedOrNull';
import { getDBConnection } from './surrealDBService';
import { getRuntimeConfig } from './dbServiceAdapter';
import { TreeUserId } from '../model/runtimeConfig';

const bot = new discord.Client({
  intents:
    [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
      Intents.FLAGS.GUILD_PRESENCES,
      Intents.FLAGS.GUILD_INTEGRATIONS,
      Intents.FLAGS.GUILD_VOICE_STATES,
      Intents.FLAGS.DIRECT_MESSAGES,
      Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
    ],
  partials: ["CHANNEL"]
});

export const botStatusEmitter = new BotStatusEmitter();

const deletedMessageFile = 'deletedMessageFile.json';
const THE_FOREST_ID = process.env.THE_FOREST_ID ?? throwIfNull('Discord server ID is undefined');

const WHISS_USER_ID = process.env.WHISS_USER_ID;

export const BOT_PREFIX = '!'

const commands = [BOT_PREFIX + 'play', `${BOT_PREFIX}skip`, `${BOT_PREFIX}remove %number%`, `${BOT_PREFIX}queue`, `${BOT_PREFIX}pause`, `${BOT_PREFIX}clearQueue`, `${BOT_PREFIX}join`];

const login = async () => {
  const db = await getDBConnection('ref');
  console.log('got db connection');
  const [botKeyResult] = await db.select('secrets:discord_bot');
  if (botKeyResult && typeof botKeyResult === 'object'
    && 'password' in botKeyResult
    && typeof botKeyResult.password === 'string') {
    bot.login(botKeyResult.password)
  } else {
    console.error(`result isn't a object with password in it ${JSON.stringify(botKeyResult, null, 2)}`)
  }
}
login()

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
    .filter(channel => typeof channelId === 'undefined' || channel.id === channelId)
    .forEach(channel => {
      if (channel.isVoice()) {
        channel.members.forEach(member => usersOnline.push(member.user.username))
      }
    });
  return usersOnline;
}

export async function whoIs(msg: Message) {
  const treeUserId = await getRuntimeConfig(TreeUserId)
  if (msg.author.id == treeUserId.value) {
    const id = msg.content.split(" ")[1];
    const userPromise = bot.users.fetch(id);
    userPromise.then(user => {
      if (user != null) {
        msg.channel.send(user.username);
      } else {
        msg.channel.send("誰もいない");
      }
    }).catch(reason => {
      console.warn(`unable to get username from message ${msg}`, reason);
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
      if (activity.type === 'CUSTOM') {
        return {
          message: `${botUser.username}'s status is: ${activity.name}`,
          avatarURL: `${botUser.avatarURL()}`
        } as BotStatusOrUndefined<T>
      } else {
        return {
          message: `${botUser.username} is ${activity.type.toLowerCase()}${addedWordToBotStatus(activity.type)}${activity.name}`,
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
      return ' to ';
    case 'COMPETING':
      return ' in ';
    default:
      return ' ';
  }
}

function treeDisplayType(activityType: ActivityType) {
  switch (activityType) {
    case 'CUSTOM':
      return '';
    default:
      return activityType.toLocaleLowerCase().replace('ing', '');
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
  if (channel?.isText()) {
    channel.send(message);
  }
}

bot.on('presenceUpdate', async (oldSatus, newStatus) => {
  //Check if the user is me, and if there is a real staus change
  const treeUserId = await getRuntimeConfig(TreeUserId)
  if (newStatus.member?.id === treeUserId.value && newStatus.guild?.id === THE_FOREST_ID && newStatus.activities !== oldSatus?.activities) {
    const botStatus = bot.user?.presence.activities[0];
    if (!botStatus || botStatus.type === 'WATCHING') {
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
        updateBotStatus(statusMessage, { type: 'WATCHING' });
      } else {
        updateBotStatus();
      }
    }
  }
});

export default bot;