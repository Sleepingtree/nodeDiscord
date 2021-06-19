import { Message, TextChannel } from "discord.js";
import bot, {BOT_PREFIX} from './discordLogIn';

const CLASH_PLANING_TEXT_CHANNEL = process.env.CLASH_PLANING_TEXT_CHANNEL;
const TREE_USER_ID = process.env.TREE_USER_ID;

bot.on('message', msg => {
  if(msg.content.startsWith(BOT_PREFIX + 'clashMessage')) {
    addClashTime(msg);
  }
});

async function addClashTime(msg: Message){
  const message = msg.content.split("-payload ")[1];

  if(CLASH_PLANING_TEXT_CHANNEL && TREE_USER_ID && msg.author.id.toString() === TREE_USER_ID){
    const channel = <TextChannel> await bot.channels.fetch(CLASH_PLANING_TEXT_CHANNEL);
    const post = await channel.send(message);
    await post.react('✅');
    //yellow square
    await post.react('🟨');
    //red X
    await post.react('❌');
  }else{
    console.warn(`didn't post the meesage because one of thise is false 
    CLASH_PLANING_TEXT_CHANNEL:${typeof CLASH_PLANING_TEXT_CHANNEL === "undefined"}, TREE_USER_ID:${TREE_USER_ID}
    or auther == tree? ${msg.author.id.toString() === TREE_USER_ID}`);
  }
}