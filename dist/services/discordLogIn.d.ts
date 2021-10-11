import Discord, { ActivityOptions, Message, Snowflake } from 'discord.js';
import { Presence } from 'discord.js';
import BotStatusEmitter from '../model/botStatusEmitter';
import BotStatus from '../model/botStatus';
declare const bot: Discord.Client<boolean>;
export declare const botStatusEmitter: BotStatusEmitter;
export declare const BOT_PREFIX = "!";
export declare function getChannelNameFromId(channelId: Snowflake): Promise<string | void>;
export declare function whosOnline(channelId?: Snowflake): Promise<string[]>;
export declare function whoIs(msg: Message): void;
declare type BotStatusOrUndefined<T extends BotStatus | Presence | undefined | null> = T extends undefined | null ? undefined : BotStatus;
export declare function getBotStatus<T extends Presence>(botStatus?: T): BotStatusOrUndefined<T>;
<<<<<<< HEAD
export declare function updateBotStatus(status?: string, options?: ActivityOptions): void;
=======
export declare function updateBotStatus(status?: string, options?: ActivityOptions): Promise<void>;
>>>>>>> master
export declare function postMessageInChannel(message: string, channelName: string): Promise<void>;
export default bot;
