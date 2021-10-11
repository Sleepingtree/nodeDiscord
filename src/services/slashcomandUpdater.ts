import fetch from 'node-fetch'
import fs from 'fs/promises'
import throwIfNull from '../util/throwIfUndefinedOrNull';

const TOKEN = process.env.DISCORD_BOT_KEY ?? throwIfNull('bot token was undefined');
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID ?? throwIfNull('discord application id is undeifed');


(async () => {
    const commandFiles = (await fs.readdir('./dist/discordCommands')).filter(file => file.endsWith('.js'));
    const discordCommands: any = [];
    commandFiles.forEach(file => {
        const fileCommands = require(`../discordCommands/${file}`).default;
        fileCommands.commands.forEach((item: any) => discordCommands.push(item.slashCommand.toJSON()));
    });
    const result = await fetch(`https://discord.com/api/v9/applications/${APPLICATION_ID}/commands`, {
        headers: {
            "Authorization": `Bot ${TOKEN}`
        },
        body: discordCommands,
        method: 'POST'
    });
    console.log(result);
})();