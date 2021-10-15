"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const youtubeService_1 = require("../services/youtubeService");
const songNameOption = 'song';
class youtubCommands {
    constructor() {
        this.commands = [
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('play')
                    .addStringOption(option => option.setName(songNameOption).setDescription('Will search youtube and grab the first result').setRequired(true))
                    .setDescription('plays the song, or adds it to the queue if something is playing'),
                cb: youtubeService_1.handlePlayCommand
            }
        ];
    }
}
exports.default = new youtubCommands();
//# sourceMappingURL=youTubeSlashCommands.js.map