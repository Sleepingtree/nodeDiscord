import { Client, Message, TextChannel } from "discord.js";

const CLASH_PLANING_TEXT_CHANNEL = process.env.CLASH_PLANING_TEXT_CHANNEL;

export async function addClashTime(bot: Client, msg: Message){
  let message = msg.content.split("-payload ")[1];
  let channel = <TextChannel> await bot.channels.fetch(CLASH_PLANING_TEXT_CHANNEL);
  const post = await channel.send(message);
  await post.react('✅');
  //yellow square
  await post.react('🟨');
  //red X
  await post.react('❌');
}