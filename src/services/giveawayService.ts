import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton } from "discord.js";
import bot from '../services/discordLogIn';
import fs from 'fs';

export const startCommand = 'start';
export const restartCommand = 'restart';
export const addingMoreItemsCommand = 'additional-prizes';
export const numberOfItemsAdded = 'number-of-prizes';
export const numberOfItemsToGiveAway = 'items-in-bank';

export const joinGiveawayButton = 'joinGiveaway';
export const endGiveawayButton = 'endGiveaway';
export const giveGiveawayPrize = 'givePrize';
export const noPrize = 'noPrize';

const guildRoleName = 'It lives!';

const giveawayFile = 'giveaway.json'

type GiveawayFile = {
    [key: string]: Giveaway | undefined
}

type Giveaway = {
    startedUser: string,
    numberOfItems: number,
    joinedUsers: {
        userId: string
        won: boolean
        requestSlot: number
    }[]
}

const notInGuildMesage = { ephemeral: true, content: 'You must be in a discord server to use this!' };

export const handleGiveAwayCommand = async (interaction: CommandInteraction) => {
    const realCommand = interaction.options.getSubcommand();
    if (realCommand === startCommand) {
        handleStart(interaction);
    } else if (realCommand === restartCommand) {
        handleRestartCommand(interaction);
    } else if (realCommand === addingMoreItemsCommand) {

    } else {
        console.log('Unhandled giveAway command');
    }
}

const handleStart = async (interaction: CommandInteraction) => {
    const guildId = interaction.guildId;
    const startingItemCount = interaction.options.getNumber(numberOfItemsToGiveAway);
    if (!guildId || !startingItemCount) {
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
    convertedFile[guildId] = {
        startedUser: interaction.user.id,
        numberOfItems: startingItemCount,
        joinedUsers: []
    };
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
        const roleId = (await bot.guilds.fetch(guildId)
            .then(guild => guild.roles)
            .then(roleMan => roleMan.fetch()))
            .find(role => role.name === guildRoleName)?.id
        const roles = interaction.member?.roles;
        if (!roles || !roleId) {
            console.error(`can't find role for user. roles: ${roles} roleId: ${roleId}`)
            return;
        }
        const isGuildMember = roles instanceof Array ?
            roles.find((role) => role === roleId) !== undefined :
            roles.cache.has(roleId);

        if (!isGuildMember) {
            interaction.editReply('Sorry Guild members only!')
            return;
        }

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
                darwOrRedrawForUser(interaction, guildGiveaway, convertedFile);
            }
        } else {
            darwOrRedrawForUser(interaction, guildGiveaway, convertedFile);
        }
    } else {
        const randomSeed = Math.random();
        console.log(`failed join button push ${randomSeed}`);
        interaction.reply({ ephemeral: true, content: `Something went wrong send tree this! > ${randomSeed}` });
    }
}

const darwOrRedrawForUser = (interaction: ButtonInteraction, guildGiveaway: Giveaway, convertedFile: GiveawayFile) => {
    interaction.editReply(`reply with a number between 1 and ${guildGiveaway.numberOfItems}`)
    const filter = (m: Message) => interaction.user.id === m.author.id;
    interaction.channel?.awaitMessages({ filter, time: 60000, max: 1, errors: ['time'] })
        .then(async messages => {
            const rawResponse = messages.first()?.content;
            const numberResponse = Number(rawResponse);
            if (numberResponse === NaN || numberResponse < 1 || numberResponse > guildGiveaway.numberOfItems) {
                interaction.followUp({ content: `You've entered: ${messages.first()?.content}`, ephemeral: true });
            } else {
                await interaction.followUp(`You've entered: ${messages.first()?.content}`);

                guildGiveaway.joinedUsers = guildGiveaway.joinedUsers.filter(user => user.userId !== interaction.user.id)
                guildGiveaway.joinedUsers.push({ userId: interaction.user.id, won: false, requestSlot: numberResponse });

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
                startedUser.send({ content: `<@${interaction.user.id}> joined the giveway asking for item  ${numberResponse} give them something nice for me!`, components: [messageActionRow] })
                interaction.editReply(`You've been entered in the giveaway with a the number ${numberResponse}. \r\n I hope you get something good!`);
            }

        })
        .catch(() => {
            interaction.followUp('You did not enter any input!');
        });
}

export const handleEndCommand = async (interaction: ButtonInteraction) => {
    const parentInteraction = interaction.message;
    await interaction.deferReply({ ephemeral: true });
    if ('guildId' in parentInteraction) {
        const guildId = parentInteraction.guildId;
        if (!guildId) {
            interaction.reply(notInGuildMesage);
            return;
        }
        const file = fs.readFileSync(giveawayFile, 'utf-8');
        const convertedFile = JSON.parse(file) as GiveawayFile;
        const giveaway = convertedFile[guildId];
        if (interaction.message.author.id !== giveaway?.startedUser) {
            interaction.editReply(`That's not up to you I'm telling!`);
            console.log(`${interaction.user.username} tried to end the giveaway!`);
        }
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
                --users.numberOfItems;
                convertedFile[guildId] = users;
            }
        }
        fs.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
        interaction.editReply({ content: `I took all the credit for the gift 😊 there's ${users?.numberOfItems} left in the bank!`, components: [] });
    }
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