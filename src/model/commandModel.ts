import { SlashCommandBuilder } from "@discordjs/builders";

export default interface CommandModel {
    commands: [{
        slashCommand: SlashCommandBuilder;
    }]
}