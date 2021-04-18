/// <reference types="node" />
import { ClientOptions, UserManager } from "discord.js";
import EventEmitter from "events";
declare class DiscordBot extends EventEmitter {
    GAME_NAME: string | null;
    options: ClientOptions;
    users: UserManager;
    constructor();
    on(event: string | symbol, listener: (...args: any[]) => void): this;
}
declare const bot: DiscordBot;
export default bot;
