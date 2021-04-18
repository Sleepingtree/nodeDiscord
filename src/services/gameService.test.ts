import { getTeamMessage } from './gameService';
import bot from './discordLogIn';
import { Guild, GuildMember, Message, TextChannel } from 'discord.js';

jest.mock('./twitchService');
//jest.mock('./discordLogIn');

test('Test no game started', () => {
    expect(getTeamMessage()).toBe('No in house game started');
});

describe('Game started tests', () => {
    const testGuild = new Guild(bot, {});
    const testChannel = new TextChannel(testGuild, {type:'text'});
    const messageSender = new GuildMember(bot, {}, testGuild);
    const messageData = {
        id:'1000000000',
        content:'!startGame',
        member: messageSender
    };
    const testMessage = new Message(bot, messageData, testChannel);
    Object.defineProperty(testMessage, 'member', {value: 'test'});
    bot.emit('message', testMessage);
    expect(getTeamMessage()).toBe('Started game of');
});