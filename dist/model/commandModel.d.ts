import { SlashCommandBuilder } from "@discordjs/builders";
import { Interaction } from "discord.js";
export default interface CommandModel {
    commands: [
        {
            slashCommand: SlashCommandBuilder;
            cb: (interaction: Interaction) => void;
        }
    ];
}
