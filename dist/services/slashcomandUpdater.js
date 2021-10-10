"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const discordLogIn_1 = __importDefault(require("./discordLogIn"));
const promises_1 = __importDefault(require("fs/promises"));
const discordCommands = [];
(async () => {
    const commandFiles = (await promises_1.default.readdir('./dist/discordCommands')).filter(file => file.endsWith('.js'));
    commandFiles.forEach(file => {
        const fileCommands = require(`../discordCommands/${file}`).default;
        fileCommands.forEach((item) => discordCommands.push(item));
    });
})();
(_a = discordLogIn_1.default.application) === null || _a === void 0 ? void 0 : _a.commands.set(discordCommands);
discordLogIn_1.default.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand())
        return;
    const command = discordLogIn_1.default.commands.get(interaction.commandName);
    if (!command)
        return;
    try {
        await command.sb(interaction);
    }
    catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});
//# sourceMappingURL=slashcomandUpdater.js.map