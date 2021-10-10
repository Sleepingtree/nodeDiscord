import { SlashCommandBuilder } from "@discordjs/builders";
import { GuildMember, Interaction } from "discord.js";
import CommandModel from "../model/commandModel";
import { resume, searchAndAddYoutube } from "../services/youtubeService";

const songNameOption = 'song';

const notInGuildMessage = 'You must send messages in a server channel';

const playCallback = async (interaction: Interaction) => {
    if (interaction.isCommand()) {
        const songName = interaction.options.getString(songNameOption);
        if (interaction.guildId && interaction.channel?.isText()) {
            if (songName) {
                if (interaction.member instanceof GuildMember) {
                    searchAndAddYoutube(interaction.guildId, interaction.channel, interaction.member, songName)
                } else {
                    console.warn('user is an api user?')
                }
            } else {
                resume(interaction.guildId, interaction.channel);
            }
        } else {
            interaction.reply(notInGuildMessage)
        }
    }
}

class youtubCommands implements CommandModel {
    commands: [{ slashCommand: SlashCommandBuilder; cb: (interaction: Interaction) => void; }] = [
        {
            slashCommand: new SlashCommandBuilder()
                .setName('play')
                .addStringOption(option => option.setName(songNameOption).setDescription('Will search youtube and grab the first result'))
                .setDescription('plays the song, or adds it to the queue if something is playing'),
            cb: playCallback
        }
    ];
}

export default new youtubCommands().commands.map(command => command.slashCommand.toJSON());