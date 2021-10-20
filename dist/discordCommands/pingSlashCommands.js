"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
class PingSlashCommands {
    constructor() {
        this.commands = [
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('ping')
                    .setDescription('see if the bot is alive'),
                cb: (interaction) => interaction.reply('Pong!'),
                needsUpdate: false
            }
        ];
    }
}
exports.default = new PingSlashCommands();
//# sourceMappingURL=pingSlashCommands.js.map