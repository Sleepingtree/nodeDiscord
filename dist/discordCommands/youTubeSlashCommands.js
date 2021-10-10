"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const youtubeService_1 = require("../services/youtubeService");
const songNameOption = 'song';
const notInGuildMessage = 'You must send messages in a server channel';
const playCallback = async (interaction) => {
    var _a;
    if (interaction.isCommand()) {
        const songName = interaction.options.getString(songNameOption);
        if (interaction.guildId && ((_a = interaction.channel) === null || _a === void 0 ? void 0 : _a.isText())) {
            if (songName) {
                if (interaction.member instanceof discord_js_1.GuildMember) {
                    (0, youtubeService_1.searchAndAddYoutube)(interaction.guildId, interaction.channel, interaction.member, songName);
                }
                else {
                    console.warn('user is an api user?');
                }
            }
            else {
                (0, youtubeService_1.resume)(interaction.guildId, interaction.channel);
            }
        }
        else {
            interaction.reply(notInGuildMessage);
        }
    }
};
class youtubCommands {
    constructor() {
        this.commands = [
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('play')
                    .addStringOption(option => option.setName(songNameOption).setDescription('Will search youtube and grab the first result'))
                    .setDescription('plays the song, or adds it to the queue if something is playing'),
                cb: playCallback
            }
        ];
    }
}
exports.default = new youtubCommands().commands.map(command => command.slashCommand.toJSON());
//# sourceMappingURL=youTubeSlashCommands.js.map