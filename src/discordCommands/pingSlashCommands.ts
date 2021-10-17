import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import CommandModel from "../model/commandModel";

class PingSlashCommands implements CommandModel {
    commands = [
        {
            slashCommand: new SlashCommandBuilder()
                .setName('ping')
                .setDescription('see if the bot is alive'),
            cb: (interaction: CommandInteraction) => interaction.reply('Pong!'),
            needsUpdate: false
        }
    ];
}

export default new PingSlashCommands();