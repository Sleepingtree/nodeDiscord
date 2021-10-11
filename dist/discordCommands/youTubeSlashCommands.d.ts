import { SlashCommandBuilder } from "@discordjs/builders";
import CommandModel from "../model/commandModel";
declare class youtubCommands implements CommandModel {
    commands: [{
        slashCommand: SlashCommandBuilder;
    }];
}
declare const _default: youtubCommands;
export default _default;
