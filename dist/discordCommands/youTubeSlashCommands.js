"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const youtubeService_1 = require("../services/youtubeService");
class youtubCommands {
    constructor() {
        this.commands = [
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('play')
                    .addStringOption(option => option.setName(youtubeService_1.songNameOption).setDescription('Will search youtube and grab the first result').setRequired(true))
                    .setDescription('plays the song, or adds it to the queue if something is playing'),
                cb: youtubeService_1.handlePlayCommand,
                needsUpdate: false
            },
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('skip')
                    .setDescription('Skips the song and goes to the next song if there is one'),
                cb: youtubeService_1.handleSkipCommand,
                needsUpdate: false
            },
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('list-queue')
                    .setDescription('shows you the song queue'),
                cb: youtubeService_1.handleQueueCommand,
                needsUpdate: false
            },
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('remove')
                    .addNumberOption(option => option.setName(youtubeService_1.removeNameOption).setDescription('the number of the song to remove').setRequired(true))
                    .setDescription('Removes a song from the play queue use list-queue to get the number of the song'),
                cb: youtubeService_1.handleRemoveCommand,
                needsUpdate: false
            },
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('pause')
                    .setDescription('pauses the song use resume to play again'),
                cb: youtubeService_1.handlePauseCommand,
                needsUpdate: false
            },
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('resume')
                    .setDescription('plays what\'s in queue if there is anything'),
                cb: youtubeService_1.handleResumeCommand,
                needsUpdate: false
            },
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('clear-queue')
                    .setDescription('stops playing and removes the play queue'),
                cb: youtubeService_1.handleClearQueue,
                needsUpdate: false
            },
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('join')
                    .setDescription('moves the bot to your current voice channel'),
                cb: youtubeService_1.handleJoinCommand,
                needsUpdate: false
            }
        ];
    }
}
exports.default = new youtubCommands();
//# sourceMappingURL=youTubeSlashCommands.js.map