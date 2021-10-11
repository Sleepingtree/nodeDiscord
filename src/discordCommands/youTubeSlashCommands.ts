import { SlashCommandBuilder } from "@discordjs/builders";
import CommandModel from "../model/commandModel";
const songNameOption = 'song';
class youtubCommands implements CommandModel {
    commands: [{ slashCommand: SlashCommandBuilder }] = [
        {
            slashCommand: new SlashCommandBuilder()
                .setName('play')
                .addStringOption(option => option.setName(songNameOption).setDescription('Will search youtube and grab the first result'))
                .setDescription('plays the song, or adds it to the queue if something is playing')
        }
    ];
}

export default new youtubCommands();