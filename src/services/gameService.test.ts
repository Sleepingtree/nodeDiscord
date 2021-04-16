import { getTeamMessage } from './gameService';

jest.mock('./twitchService');
//jest.mock('./discordLogIn')

test('Test no game started', () =>{
    expect(getTeamMessage()).toBe('No in house game started');
});