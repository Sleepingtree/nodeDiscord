import fetch from 'node-fetch'
import fs from 'fs/promises'
import bot from './discordLogIn'
import CommandModel from '../model/commandModel';
import { ButtonInteraction, CommandInteraction } from "discord.js";
import { BotSignInToken } from '../model/runtimeConfig';
import { getRuntimeConfig } from './dbServiceAdapter';



(async () => {
    try {
        const { username: applicationId, password: token } = await getRuntimeConfig(BotSignInToken)
        const commandFiles = (await fs.readdir('./dist/discordCommands')).filter(file => file.endsWith('.js'));

        const commandMap = new Map<string, (interaction: CommandInteraction) => void>();

        const buttonCommandMap = new Map<string, (interaction: ButtonInteraction) => void>();

        commandFiles.forEach(file => {
            const fileCommands = require(`../discordCommands/${file}`).default as CommandModel;
            fileCommands.commands.forEach(async item => {
                commandMap.set(item.slashCommand.name, item.cb);
                if (item.needsUpdate) {
                    const result = await fetch(`https://discord.com/api/v9/applications/${applicationId}/commands`, {
                        headers: {
                            "Authorization": `Bot ${token}`,
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

            fileCommands.buttonCommands?.forEach(command => {
                buttonCommandMap.set(command.name, command.cb);
            });
        });

        bot.on('interactionCreate', (interaction) => {
            if (interaction.isCommand()) {
                const cb = commandMap.get(interaction.commandName);
                if (cb) {
                    console.log(`calling command ${interaction.commandName}`);
                    cb(interaction);
                } else {
                    console.error('no command cb function defined!');
                }
            } else if (interaction.isButton()) {
                const cb = buttonCommandMap.get(interaction.customId);
                if (cb) {
                    console.log(`calling button command ${interaction.customId}`);
                    cb(interaction);
                } else {
                    console.error('no button cb function defined!');
                }
            } else {
                console.warn('interaction, but not command or button');
            }
        })
    } catch (e) {
        console.error('error updating commands', e)
    }
})();

