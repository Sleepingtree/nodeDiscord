import CommandModel from "../model/commandModel";
declare class giveawaySlashCommands implements CommandModel {
    commands: {
        slashCommand: import("@discordjs/builders").SlashCommandSubcommandsOnlyBuilder;
        cb: (interaction: import("discord.js").CommandInteraction) => Promise<void>;
        needsUpdate: boolean;
    }[];
    buttonCommands: {
        name: string;
        cb: (interaction: import("discord.js").ButtonInteraction) => Promise<void>;
    }[];
}
declare const _default: giveawaySlashCommands;
export default _default;
