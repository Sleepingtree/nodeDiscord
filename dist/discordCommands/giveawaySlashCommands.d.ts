import CommandModel from "../model/commandModel";
declare class giveawaySlashCommands implements CommandModel {
    commands: {
        slashCommand: import("@discordjs/builders").SlashCommandSubcommandsOnlyBuilder;
        cb: (interaction: import("discord.js").CommandInteraction<import("discord.js").CacheType>) => Promise<void>;
        needsUpdate: boolean;
    }[];
    buttonCommands: {
        name: string;
        cb: (interaction: import("discord.js").ButtonInteraction<import("discord.js").CacheType>) => Promise<void>;
    }[];
}
declare const _default: giveawaySlashCommands;
export default _default;
