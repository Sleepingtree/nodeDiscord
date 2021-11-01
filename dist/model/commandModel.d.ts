import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction } from "discord.js";
declare type commandType = {
    slashCommand: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
    cb: (interaction: CommandInteraction) => Promise<void>;
    needsUpdate?: boolean;
};
declare type buttonCommands = {
    name: string;
    cb: (ineraction: ButtonInteraction) => Promise<void>;
};
export default interface CommandModel {
    commands: commandType[];
    buttonCommands?: buttonCommands[];
}
export {};
