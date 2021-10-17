import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import CommandModel from "../model/commandModel";
declare class PingSlashCommands implements CommandModel {
    commands: {
        slashCommand: SlashCommandBuilder;
        cb: (interaction: CommandInteraction) => Promise<void>;
        needsUpdate: boolean;
    }[];
}
declare const _default: PingSlashCommands;
export default _default;
