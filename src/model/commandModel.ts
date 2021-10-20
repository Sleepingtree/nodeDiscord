import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

type commandType = {
    slashCommand: SlashCommandBuilder;
    cb: (interaction: CommandInteraction) => Promise<void>;
    needsUpdate: boolean
}
export default interface CommandModel {
    commands: commandType[]
}