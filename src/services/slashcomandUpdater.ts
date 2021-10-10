import bot from './discordLogIn';
import fs from 'fs/promises'

const discordCommands: any[] = [];
(async () => {
    const commandFiles = (await fs.readdir('./dist/discordCommands')).filter(file => file.endsWith('.js'));
    commandFiles.forEach(file => {
        const fileCommands = require(`../discordCommands/${file}`).default;
        fileCommands.forEach((item: any) => discordCommands.push(item));
    });
})();

bot.application?.commands.set(discordCommands);


bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const command = (bot as any).commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.sb(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});