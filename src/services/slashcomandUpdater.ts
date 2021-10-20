import fetch from 'node-fetch'
import fs from 'fs/promises'
import throwIfNull from '../util/throwIfUndefinedOrNull';
import bot from './discordLogIn'
import CommandModel from '../model/commandModel';
import { CommandInteraction } from "discord.js";

const TOKEN = process.env.DISCORD_BOT_KEY ?? throwIfNull('bot token was undefined');
const APPLICATION_ID = process.env.DISCORD_APPLICATION_ID ?? throwIfNull('discord application id is undeifed');


(async () => {
    const commandFiles = (await fs.readdir('./dist/discordCommands')).filter(file => file.endsWith('.js'));
    const commandMap = new Map<string, (interaction: CommandInteraction) => void>();
    commandFiles.forEach(file => {
        const fileCommands = require(`../discordCommands/${file}`).default as CommandModel;
        fileCommands.commands.forEach(async item => {
            commandMap.set(item.slashCommand.name, item.cb);
            if (item.needsUpdate) {
                const result = await fetch(`https://discord.com/api/v9/applications/${APPLICATION_ID}/commands`, {
                    headers: {
                        "Authorization": `Bot ${TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(item.slashCommand),
                    method: 'POST'
                });
                const reponseBody = await result.json();
                if (!result.ok) {
                    console.error(reponseBody);
                    console.error(reponseBody.errors);
                } else {
                    console.log(reponseBody);
                    console.log(`Updated bot response`);
                }
            }
        });
    });
    bot.on('interactionCreate', (interaction) => {
        if (interaction.isCommand()) {
            const cb = commandMap.get(interaction.commandName);
            if (typeof cb === 'function') {
                console.log(`calling command ${interaction.commandName}`);
                cb(interaction);
            } else {
                console.error('no cb function defined!');
            }
        } else {
            console.log('interaction, but not command?');
        }
    })
})();

