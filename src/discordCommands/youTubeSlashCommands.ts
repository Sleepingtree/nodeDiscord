import { SlashCommandBuilder } from "@discordjs/builders";
import CommandModel from "../model/commandModel";
import { handlePlayCommand } from "../services/youtubeService";

const songNameOption = 'song';
class youtubCommands implements CommandModel {
    commands = [
        {
            slashCommand: new SlashCommandBuilder()
                .setName('play')
                .addStringOption(option => option.setName(songNameOption).setDescription('Will search youtube and grab the first result').setRequired(true))
                .setDescription('plays the song, or adds it to the queue if something is playing'),
            cb: handlePlayCommand
        }
    ];
}

export default new youtubCommands();