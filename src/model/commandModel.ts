import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { ButtonInteraction, CommandInteraction } from "discord.js";

type commandType = {
    slashCommand: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder;
    cb: (interaction: CommandInteraction) => Promise<void> | void;
    needsUpdate?: boolean
}

type buttonCommands = {
    name: string
    cb: (ineraction: ButtonInteraction) => Promise<void> | void;
}
export default interface CommandModel {
    commands: commandType[]
    buttonCommands?: buttonCommands[]
}