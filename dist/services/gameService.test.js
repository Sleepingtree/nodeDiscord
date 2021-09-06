"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const gameService_1 = require("./gameService");
jest.mock('./twitchService');
//jest.mock('./discordLogIn')
test('Test no game started', () => {
    expect((0, gameService_1.getTeamMessage)()).toBe('No in house game started');
});
//# sourceMappingURL=gameService.test.js.map