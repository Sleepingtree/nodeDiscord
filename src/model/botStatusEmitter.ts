import { EventEmitter } from 'events';
import botStatus from './botStatus';

interface BotStatusEvents {
  'botStatusChange': (botStatus: botStatus, oldBotStatus?: botStatus) => void;
}

interface BotStatusEventEmitter {
  on<U extends keyof BotStatusEvents>(event: U, listener: BotStatusEvents[U]): this;
  off<U extends keyof BotStatusEvents>(event: U, listener: BotStatusEvents[U]): this;
  emit<U extends keyof BotStatusEvents>(event: U, ...args: Parameters<BotStatusEvents[U]>): boolean;
}

class BotStatusEventEmitter extends EventEmitter {
  constructor() {
    super();
  }
}

export default BotStatusEventEmitter;