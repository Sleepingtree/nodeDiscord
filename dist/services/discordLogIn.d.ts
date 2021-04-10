/// <reference types="node" />
import Discord, { ActivityOptions, Message, Snowflake } from 'discord.js';
import { EventEmitter } from 'events';
declare const bot: Discord.Client;
export declare const botStatusEmitter: EventEmitter;
export declare const botStatusChangeEvent = "botStatusChange";
export declare const BOT_PREFIX = "!";
export declare function getChannelNameFromId(channelId: Snowflake): Promise<string | void>;
export declare function whosOnline(channelId?: Snowflake): Promise<any[]>;
export declare function whoIs(msg: Message): void;
declare type botStatus = {
    message: string;
    avatarURL: string;
};
export declare function getBotStatus(): botStatus | undefined;
export declare function updateBotStatus(status?: string, options?: ActivityOptions): Promise<void>;
export default bot;
