"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const gameService_1 = require("./gameService");
const discordLogIn_1 = __importDefault(require("./discordLogIn"));
const discord_js_1 = require("discord.js");
jest.mock('./twitchService');
jest.mock('./discordLogIn');
test('Test no game started', () => {
    expect(gameService_1.getTeamMessage()).toBe('No in house game started');
});
describe('Game started tests', () => {
    const testGuild = new discord_js_1.Guild(discordLogIn_1.default, {});
    const testChannel = new discord_js_1.TextChannel(testGuild, { type: 'text' });
    const messageSender = new discord_js_1.GuildMember(discordLogIn_1.default, {}, testGuild);
    const messageData = {
        id: '1000000000',
        content: '!startGame',
        member: messageSender
    };
    const testMessage = new discord_js_1.Message(discordLogIn_1.default, messageData, testChannel);
    discordLogIn_1.default.emit('message', testMessage);
    expect(gameService_1.getTeamMessage()).toBe('Started game of');
});
//# sourceMappingURL=gameService.test.js.map