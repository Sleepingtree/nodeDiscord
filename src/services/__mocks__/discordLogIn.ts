import { Client, ClientOptions, UserManager } from "discord.js";
import EventEmitter from "events";

class DiscordBot extends EventEmitter{

    GAME_NAME: string | null;
    options: ClientOptions;
    users: UserManager;

    constructor(){
        super();
        this.GAME_NAME = null;
        this.options ={
            messageCacheMaxSize: 64
        };
        this.users = new UserManager(new Client());

    }

    on(event: string | symbol, listener: (...args: any[]) => void): this{
        console.log('in here')
        return this;
    }
}
const bot = new DiscordBot();


export default bot;