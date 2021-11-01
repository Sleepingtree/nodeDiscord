import { ButtonInteraction, CommandInteraction, MessageActionRow, MessageButton } from "discord.js";
import bot from '../services/discordLogIn';
import fs from 'fs';

export const startCommand = 'start';
export const restartCommand = 'restart';

export const joinGiveawayButton = 'joinGiveaway';
export const endGiveawayButton = 'endGiveaway';
export const giveGiveawayPrize = 'givePrize';
export const noPrize = 'noPrize';

const giveawayFile = 'giveaway.json'

type GiveawayFile = {
    [key: string]: {
        startedUser: string,
        joinedUsers: {
            userId: string
            won: boolean
            roll: number
        }[]
    } | undefined
}

const notInGuildMesage = { ephemeral: true, content: 'You must be in a discord server to use this!' };

export const handleGiveAwayCommand = async (interaction: CommandInteraction) => {
    const realCommand = interaction.options.getSubcommand();
    if (realCommand === startCommand) {
        handleStart(interaction);
    } else if (realCommand === restartCommand) {
        handleRestartCommand(interaction);
    } else {
        console.log('Unhandled giveAway command');
    }
}

const handleStart = async (interaction: CommandInteraction) => {
    const guildId = interaction.guildId;
    if (!guildId) {
        interaction.reply(notInGuildMesage);
        return;
    }
    await interaction.deferReply()
    const file = fs.readFileSync(giveawayFile, 'utf8');
    const convertedFile = JSON.parse(file) as GiveawayFile;
    const messageActionRow = new MessageActionRow().addComponents(
        new MessageButton().setCustomId(joinGiveawayButton)
            .setLabel('Join giveaway')
            .setStyle('PRIMARY')
            .setEmoji('🎉')
    ).addComponents(
        new MessageButton().setCustomId(endGiveawayButton)
            .setLabel('end giveaway')
            .setStyle('DANGER')
    )
    convertedFile[guildId] = { startedUser: interaction.user.id, joinedUsers: [] };
    fs.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
    interaction.editReply({
        content: 'Raffle started! click on join to get your phat stacks',
        components: [messageActionRow]
    })
}

export const handleJoinCommand = async (interaction: ButtonInteraction) => {
    const parentInteraction = interaction.message;
    if ('guildId' in parentInteraction) {
        const guildId = parentInteraction.guildId;
        if (!guildId) {
            interaction.reply(notInGuildMesage);
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const file = fs.readFileSync(giveawayFile, 'utf-8');
        const convertedFile = JSON.parse(file) as GiveawayFile;
        const guildGiveaway = convertedFile[guildId];
        if (!guildGiveaway) {
            const randomSeed = Math.random();
            console.log(`failed join button push ${randomSeed}`);
            interaction.editReply(`Bot broke send tree this > ${randomSeed}`);
            return;
        }
        const user = guildGiveaway.joinedUsers.find(user => user.userId === interaction.user.id);
        if (user) {
            if (user.won) {
                interaction.editReply('You have already won something!')
            } else {
                interaction.editReply(`You are already entered with a roll of ${user.roll} \r\n Either you didn't win yet or the giveaway team is busy!`);
            }
        } else {
            const roll = Math.floor((Math.random() * 100) + 1);
            guildGiveaway.joinedUsers.push({ userId: interaction.user.id, won: false, roll: roll })
            fs.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
            const startedUser = await bot.users.fetch(guildGiveaway.startedUser);
            const messageActionRow = new MessageActionRow().addComponents(
                new MessageButton().setCustomId(giveGiveawayPrize)
                    .setLabel(`I gave ${interaction.user.username} a prize!`)
                    .setStyle('PRIMARY')
                    .setEmoji('🎉')
            ).addComponents(
                new MessageButton().setCustomId(noPrize)
                    .setLabel('No prize')
                    .setStyle('DANGER')
                    .setEmoji('😔')
            )
            startedUser.send({ content: `<@${interaction.user.id}> joined the giveway with a roll of ${roll} give them something nice for me!`, components: [messageActionRow] })
            interaction.editReply(`You've been entered in the giveaway with a roll of ${roll}. \r\n I hope you get something good!`);
        }
    } else {
        const randomSeed = Math.random();
        console.log(`failed join button push ${randomSeed}`);
        interaction.reply({ ephemeral: true, content: `Something went wrong send tree this! > ${randomSeed}` });
    }
}

export const handleEndCommand = async (interaction: ButtonInteraction) => {
    const parentInteraction = interaction.message;
    if ('guildId' in parentInteraction) {
        const guildId = parentInteraction.guildId;
        if (!guildId) {
            interaction.reply(notInGuildMesage);
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const file = fs.readFileSync(giveawayFile, 'utf-8');
        const convertedFile = JSON.parse(file) as GiveawayFile;
        const giveaway = convertedFile[guildId];
        const replyMessage = `Give away is over with ${giveaway?.joinedUsers.filter(user => user.won).length} winners out of ${giveaway?.joinedUsers.length} players`;
        convertedFile[guildId] = undefined;
        fs.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
        await parentInteraction.edit({ content: replyMessage, components: [] })
        interaction.editReply({ content: 'Give away has ended', components: [] });
    }
}

const handleRestartCommand = async (interaction: CommandInteraction) => {
    const guildId = interaction.guildId
    if (!guildId) {
        interaction.reply(notInGuildMesage);
        return;
    }
    await interaction.deferReply();
    const file = fs.readFileSync(giveawayFile, 'utf-8');
    const convertedFile = JSON.parse(file) as GiveawayFile;
    const giveaway = convertedFile[guildId];
    let reply = { ephemeral: true, content: "You can't restart the giveaway" }
    if (giveaway && giveaway.startedUser === interaction.user.id) {
        giveaway.joinedUsers = [];
        reply = { ephemeral: true, content: 'Winners have been reset' }
    }
    fs.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
    interaction.editReply(reply);
}

export const handlePrize = async (interaction: ButtonInteraction) => {
    //I should fix this when I have time
    const winnerId = interaction.message.content.split('<@')[1].split('>')[0];
    if ('edit' in interaction.message) {
        interaction.message.edit({ components: [] });
    }
    const ownerId = interaction.user.id;
    await interaction.deferReply({ ephemeral: true });
    const file = fs.readFileSync(giveawayFile, 'utf-8');
    const convertedFile = JSON.parse(file) as GiveawayFile;
    const guildId = Object.keys(convertedFile).find(id => convertedFile[id]?.startedUser === ownerId);
    if (guildId) {
        const users = convertedFile[guildId];
        if (users) {
            const userIndex = users.joinedUsers.findIndex(user => user.userId === winnerId);
            if (users.joinedUsers[userIndex]) {
                const user = await bot.users.fetch(users.joinedUsers[userIndex].userId)
                user.send('Hope you enjoy your gift!');
                users.joinedUsers[userIndex].won = true;
            }
        }
    }
    fs.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
    interaction.editReply({ content: 'I took all the credit for the gift 😊', components: [] });
}

export const handleNoPrize = async (interaction: ButtonInteraction) => {
    await interaction.deferReply({ ephemeral: true });
    //I should fix this when I have time
    const loserId = interaction.message.content.split('<@')[1].split('>')[0];
    if ('edit' in interaction.message) {
        interaction.message.edit({ components: [] });
    }
    console.log(interaction.message.content)
    const user = await bot.users.fetch(loserId);
    user.send('Sorry no gift for you');
    interaction.editReply({ content: 'Why did you make me send them bad news?', components: [] });
}