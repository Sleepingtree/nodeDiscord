import { CommandInteraction, GuildMember, Message } from "discord.js";
export declare const songNameOption = "song";
export declare const removeNameOption = "song-number";
export declare const handlePlayCommand: (interaction: CommandInteraction) => Promise<void>;
export declare const handleSkipCommand: (interaction: CommandInteraction) => Promise<void>;
export declare const handleRemoveCommand: (interaction: CommandInteraction) => Promise<void>;
export declare const handleQueueCommand: (interaction: CommandInteraction) => Promise<void>;
export declare const handlePauseCommand: (interaction: CommandInteraction) => Promise<void>;
export declare const handleResumeCommand: (interaction: CommandInteraction) => Promise<void>;
export declare const handleClearQueue: (interaction: CommandInteraction) => Promise<void>;
export declare const handleJoinCommand: (interaction: CommandInteraction) => Promise<void>;
export declare function handleNotInGuild(msg: Message, cb: (guildId: string) => void): void;
<<<<<<< HEAD
export declare function searchAndAddYoutube(guildId: string, channel: TextBasedChannels, member: GuildMember, search: string): Promise<string>;
export declare function resume(guildId: string, channel: TextBasedChannels): void;
=======
export declare function searchAndAddYoutube(guildId: string, member: GuildMember, search: string): Promise<string>;
export declare function checkAndIncrmentQueue(guildId: string): void;
>>>>>>> master
