import { CommandInteraction, GuildMember, Message, TextBasedChannels } from "discord.js";
export declare const handlePlayCommand: (interaction: CommandInteraction) => Promise<void>;
export declare function handleNotInGuild(msg: Message, cb: (guildId: string) => void): void;
export declare function searchAndAddYoutube(guildId: string, channel: TextBasedChannels, member: GuildMember, search: string): Promise<string>;
export declare function resume(guildId: string, channel: TextBasedChannels): void;
