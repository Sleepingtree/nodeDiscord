import Discord, { Message, Snowflake } from 'discord.js';
declare const bot: Discord.Client;
export declare const BOT_PREFIX = "!";
export declare function getChannelNameFromId(channelId: Snowflake): Promise<string | void>;
export declare function whosOnline(channelId?: Snowflake): Promise<any[]>;
export declare function whoIs(msg: Message): void;
export default bot;
