import { SlashCommandBuilder } from "@discordjs/builders";
import CommandModel from "../model/commandModel";
import {
    handlePlayCommand,
    removeNameOption,
    songNameOption,
    handleRemoveCommand,
    handlePauseCommand,
    handleClearQueue,
    handleJoinCommand,
    handleSkipCommand,
    handleQueueCommand,
    handleResumeCommand
} from "../services/youtubeService";

class youtubCommands implements CommandModel {
    commands = [
        {
            slashCommand: new SlashCommandBuilder()
                .setName('play')
                .addStringOption(option => option.setName(songNameOption).setDescription('Will search youtube and grab the first result').setRequired(true))
                .setDescription('plays the song, or adds it to the queue if something is playing'),
            cb: handlePlayCommand,
            needsUpdate: false
        },
        {
            slashCommand: new SlashCommandBuilder()
                .setName('skip')
                .setDescription('Skips the song and goes to the next song if there is one'),
            cb: handleSkipCommand,
            needsUpdate: false
        },
        {
            slashCommand: new SlashCommandBuilder()
                .setName('list-queue')
                .setDescription('shows you the song queue'),
            cb: handleQueueCommand,
            needsUpdate: false
        },
        {
            slashCommand: new SlashCommandBuilder()
                .setName('remove')
                .addNumberOption(option => option.setName(removeNameOption).setDescription('the number of the song to remove').setRequired(true))
                .setDescription('Removes a song from the play queue use list-queue to get the number of the song'),
            cb: handleRemoveCommand,
            needsUpdate: false
        },
        {
            slashCommand: new SlashCommandBuilder()
                .setName('pause')
                .setDescription('pauses the song use resume to play again'),
            cb: handlePauseCommand,
            needsUpdate: false
        },
        {
            slashCommand: new SlashCommandBuilder()
                .setName('resume')
                .setDescription('plays what\'s in queue if there is anything'),
            cb: handleResumeCommand,
            needsUpdate: false
        },
        {
            slashCommand: new SlashCommandBuilder()
                .setName('clear-queue')
                .setDescription('stops playing and removes the play queue'),
            cb: handleClearQueue,
            needsUpdate: false
        },
        {
            slashCommand: new SlashCommandBuilder()
                .setName('join')
                .setDescription('moves the bot to your current voice channel'),
            cb: handleJoinCommand,
            needsUpdate: false
        }
    ];
}

export default new youtubCommands();