import { Client, Message, TextChannel } from "discord.js";
import bot, {BOT_PREFIX} from './discordLogIn';

const CLASH_PLANING_TEXT_CHANNEL = process.env.CLASH_PLANING_TEXT_CHANNEL;

bot.on('message', msg => {
  if(msg.content.startsWith(BOT_PREFIX + 'clashMessage')) {
    addClashTime(msg);
  }
});

async function addClashTime(msg: Message){
  let message = msg.content.split("-payload ")[1];
  let channel = <TextChannel> await bot.channels.fetch(CLASH_PLANING_TEXT_CHANNEL);
  const post = await channel.send(message);
  await post.react('✅');
  //yellow square
  await post.react('🟨');
  //red X
  await post.react('❌');
}