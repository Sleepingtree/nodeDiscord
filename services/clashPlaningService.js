const CLASH_PLANING_TEXT_CHANNEL = process.env.CLASH_PLANING_TEXT_CHANNEL;

async function addClashTime(bot, msg){
  let message = msg.content.split("-payload ")[1];
  let channel = await bot.channels.fetch(CLASH_PLANING_TEXT_CHANNEL);
  const post = await channel.send(message);
  await post.react('✅');
  //yellow square
  await post.react('🟨');
  //red X
  await post.react('❌');
}

exports.addClashTime = addClashTime;