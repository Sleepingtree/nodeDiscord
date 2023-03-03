import { Message, TextChannel } from "discord.js";
import { ClashPlaningTextChannel, TreeUserId } from "../model/runtimeConfig";
import { getRuntimeConfig } from "./dbServiceAdapter";
import bot, { BOT_PREFIX } from './discordLogIn';


bot.on('messageCreate', msg => {
  if (msg.content.startsWith(BOT_PREFIX + 'clashMessage')) {
    addClashTime(msg);
  }
});

async function addClashTime(msg: Message) {
  const message = msg.content.split("-payload ")[1];
  const { value: treeUserId } = await getRuntimeConfig(TreeUserId);
  const { value: clashPlaningTextChannel } = await getRuntimeConfig(ClashPlaningTextChannel)
  if (clashPlaningTextChannel && treeUserId && msg.author.id.toString() === treeUserId) {
    const channel = <TextChannel>await bot.channels.fetch(clashPlaningTextChannel);
    const post = await channel.send(message);
    await post.react('✅');
    //yellow square
    await post.react('🟨');
    //red X
    await post.react('❌');
  } else {
    console.warn(`didn't post the meesage because one of thise is false 
    CLASH_PLANING_TEXT_CHANNEL:${typeof clashPlaningTextChannel === "undefined"}, TREE_USER_ID:${treeUserId}
    or auther == tree? ${msg.author.id.toString() === treeUserId}`);
  }
}