import * as tmi from 'tmi.js';
import * as gameService from './gameService';
const TWITCH_USER_NAME = process.env.TWITCH_USER_NAME;
const TWITCH_PASSWORD = process.env.TWITCH_PASSWORD;
const TWITCH_CHANNEL_NAME = process.env.TWITCH_CHANNEL_NAME ?? "";

const botPrefix = '!';

// Define configuration options
const opts = {
  connection:{
    reconnect: true
  },
  identity: {
    username: TWITCH_USER_NAME,
    password: TWITCH_PASSWORD
  },
  channels: [
    TWITCH_CHANNEL_NAME
  ]
};
// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function onMessageHandler (target: string, _context: tmi.ChatUserstate, msg: string, self: boolean) {
  if (self) { return; } // Ignore messages from the bot


  // Remove whitespace from chat message
  const commandName = msg.trim();

  if(!commandName.startsWith(botPrefix)){
    return;
  }

  // If the command is known, let's execute it
  if (commandName === '!dice') {
    const num = rollDice();
    client.say(target, `You rolled a ${num}`);
    console.log(`* Executed ${commandName} command`);
  } else if (commandName.startsWith(botPrefix + 'teams')) {
    sendMessage(gameService.getTeamMessage());
  }else {
    console.log(`* Unknown command ${commandName}`);
  }
}
// Function called when the "dice" command is issued
function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}
// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr: string, port: number) {
  console.log(`* Connected to ${addr}:${port}`);
}

export async function sendMessage(msg: string){
    client.say(TWITCH_CHANNEL_NAME, msg);
}
