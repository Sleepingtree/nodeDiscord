import Discord, { ActivityType, GuildChannel, Message, Snowflake } from 'discord.js';
import fs from 'fs';
const bot = new Discord.Client();

const deletedMessageFile = 'deletedMessageFile.json';
const TOKEN = process.env.DISCORD_BOT_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;

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
  jsonFile[message.id] = message
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
  if (!channelId) {
    throw 'channel id is null';
  }
  let usersOnline = new Array();
  await bot.channels.fetch(channelId)
    .then(channel => {
      const guildChannel: GuildChannel = <GuildChannel>channel;
      if (channel != null && guildChannel.members != null) {
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

type botStatus = {
  message: string;
  avatarURL: string;
}

export function getBotStatus(): botStatus | undefined {
  const botUser = bot.user;
  if (!botUser) {
    return undefined;
  } else {
    const activity = botUser.presence.activities[0];
    if (activity) {
      if (activity.type === 'CUSTOM_STATUS') {
        return {
          message: `Coco's status is: ${activity.name}`,
          avatarURL: `${botUser.avatarURL()}`
        }
      } else {
        return {
          message: `Coco is ${activity.type.toLowerCase()} ${addedWordToBotStatus(activity.type)}${activity.name}`,
        avatarURL: `${botUser.avatarURL()}`
        }
      }
    }else{
      return {
        message: `${botUser.username} is not doing anything`,
        avatarURL: `${botUser.avatarURL()}`
      }
    }
  }
}

function addedWordToBotStatus(activityType: ActivityType) {
  if (activityType === 'PLAYING' || activityType === 'STREAMING' || activityType === 'WATCHING') {
    return '';
  } else if (activityType === 'LISTENING') {
    return 'to ';
  } else if (activityType === 'COMPETING') {
    return 'in ';
  } else {
    throw `unhandled status type of ${activityType}`
  }
}

export default bot;