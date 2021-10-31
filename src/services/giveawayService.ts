import { ApplicationCommand, ButtonInteraction, CommandInteraction, MessageActionRow, MessageButton } from "discord.js";

export const startCommand = 'start';
export const restartCommand = 'restart';

export const joinGiveawayButton = 'joinGiveaway';
export const endGiveawayButton = 'endGiveaway'

export const handleGiveAwayCommand = async (interaction: CommandInteraction) => {
    const realCommand = interaction.options.getSubcommand();
    if (realCommand === startCommand) {
        handleStart(interaction);
    } else if (realCommand === restartCommand) {

    }
}

const handleStart = (interaction: CommandInteraction) => {
    const messageActionRow = new MessageActionRow().addComponents(
        new MessageButton().setCustomId(joinGiveawayButton)
            .setLabel('primary')
            .setStyle('PRIMARY')
            .setEmoji('🎉')
    ).addComponents(
        new MessageButton().setCustomId(endGiveawayButton)
            .setLabel('end')
            .setStyle('DANGER')
    )
    interaction.reply({
        content: 'Raffle started! click on join to get your phat stacks',
        components: [messageActionRow]
    })
}

export const handleJoinCommand = async (interaction: ButtonInteraction) => {
    const parentInteraction = (await interaction.fetchReply()).interaction;
    if (parentInteraction?.type === 'APPLICATION_COMMAND') {
        //bad typing/type checking from discordJS
        const guildId = (parentInteraction as unknown as ApplicationCommand).guildId
    }
    interaction.user
}