import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton } from "discord.js";
import bot from '../services/discordLogIn';
import fs from 'fs';

export const startCommand = 'start';
export const restartCommand = 'restart';
export const addingMoreItemsCommand = 'additional-prizes';
export const subtractingItemsCommnad = 'prizes-to-remove';
export const numberOfItemsAdded = 'number-of-prizes';
export const numberOfItemsToGiveAway = 'items-in-bank';

export const joinGiveawayButton = 'joinGiveaway';
export const endGiveawayButton = 'endGiveaway';
export const giveGiveawayPrize = 'givePrize';
export const noPrize = 'noPrize';

const guildRoleName = 'It lives!';
const officerRoleName = 'Officer';

const giveawayFile = 'giveaway.json'

const officerMessageMap: {
    [guildId: string]: {
        [userId: string]: {
            officerMessages: {
                messageId: string
                dmChannelId: string
            }[]
        } | undefined
    } | undefined
} = {};

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
        handleAddOrRemoveItems(interaction, true);
    } else if (realCommand === subtractingItemsCommnad) {
        handleAddOrRemoveItems(interaction, false);
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
                darwOrRedrawForUser(interaction, guildGiveaway, convertedFile, guildId);
            }
        } else {
            darwOrRedrawForUser(interaction, guildGiveaway, convertedFile, guildId);
        }
    } else {
        const randomSeed = Math.random();
        console.log(`failed join button push ${randomSeed}`);
        interaction.reply({ ephemeral: true, content: `Something went wrong send tree this! > ${randomSeed}` });
    }
}

const darwOrRedrawForUser = async (interaction: ButtonInteraction, guildGiveaway: Giveaway, convertedFile: GiveawayFile, guildId: string) => {
    try {
        const dmMessage = await interaction.user.send(`reply with a number between 1 and ${guildGiveaway.numberOfItems}`);
        interaction.followUp({ content: 'I slid into your DM, please reply there!', ephemeral: true });
        const filter = (m: Message) => interaction.user.id === m.author.id;
        const officers = (await bot.guilds.fetch(guildId))
            .members.cache.filter(member => member.roles.cache.filter(role => role.name === officerRoleName).size > 0);
        dmMessage.channel.awaitMessages({ filter, time: 60000, max: 1, errors: ['time'] })
            .then(async messages => {
                const rawResponse = messages.first()?.content;
                const numberResponse = Number(rawResponse?.trim());
                if (Number.isNaN(numberResponse) || numberResponse < 1 || numberResponse > guildGiveaway.numberOfItems) {
                    interaction.followUp({ content: `You did not enter a number, please join again with only a number`, ephemeral: true });
                } else {
                    guildGiveaway.joinedUsers = guildGiveaway.joinedUsers.filter(user => user.userId !== interaction.user.id)
                    guildGiveaway.joinedUsers.push({ userId: interaction.user.id, won: false, requestSlot: numberResponse });

                    fs.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
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
                    officers.forEach(async officer => {
                        console.log(`sending message to ${officer.user.username}`)
                        const officerMessage = await officer.send(
                            {
                                content: `<@${interaction.user.id}> joined the giveway asking for item  ${numberResponse} give them something nice for me! serverID:${guildId}`,
                                components: [messageActionRow]
                            }
                        );
                        let otherOfficerMessages = officerMessageMap[guildId];
                        if (otherOfficerMessages) {
                            let userMessageMap = otherOfficerMessages[interaction.user.id]
                            if (userMessageMap) {
                                userMessageMap.officerMessages.push({ messageId: officerMessage.id, dmChannelId: officerMessage.channelId })
                            } else {
                                userMessageMap = { officerMessages: [{ messageId: officerMessage.id, dmChannelId: officerMessage.channelId }] };
                            }
                            otherOfficerMessages[interaction.user.id] = userMessageMap;
                        } else {
                            otherOfficerMessages = {
                                [interaction.user.id]: {
                                    officerMessages: [
                                        { messageId: officerMessage.id, dmChannelId: officerMessage.channelId }
                                    ]
                                }
                            }
                        }
                        officerMessageMap[guildId] = otherOfficerMessages;
                    });
                    const reponseMesage = `You've been entered in the giveaway with a the number ${numberResponse}. \r\n I hope you get something good!`;
                    interaction.followUp({ content: reponseMesage, ephemeral: true });
                    interaction.user.send(reponseMesage);
                }
            })
            .catch(() => {
                const response = 'Are you still there? If you are please click join again!'
                interaction.followUp({ content: response, ephemeral: true });
                interaction.user.send(response);
            });
    } catch (error) {
        interaction.followUp({ content: 'I tried to slide into your DMs, but you have me blocked! Please let me in I promise not to spam you.', ephemeral: true });
        if (error instanceof Error) {
            console.error(error.name);
            console.error(error.message);
        } else {
            console.error(error)
        }
    }

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
        if (interaction.user.id !== giveaway?.startedUser) {
            interaction.editReply(`That's not up to you I'm telling!`);
            console.log(`${interaction.user.username} tried to end the giveaway!`);
            return;
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
    await interaction.deferReply({ ephemeral: true });
    const file = fs.readFileSync(giveawayFile, 'utf-8');
    const convertedFile = JSON.parse(file) as GiveawayFile;
    const guildId = interaction.message.content.split('serverID:')[1];
    if (guildId) {
        const officerInteractionMap = officerMessageMap[guildId]
        if (officerInteractionMap) {
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
                interaction.editReply({ content: `I took all the credit for the gift 😊 \r\n there's ${users?.numberOfItems} left in the bank!`, components: [] });
                officerInteractionMap[winnerId]?.officerMessages.forEach(message => {
                    if (message.dmChannelId !== interaction.channelId) {
                        bot.channels.fetch(message.dmChannelId)
                            .then(async channel => {
                                if (channel?.isText()) {
                                    const officerMessage = await channel.messages.fetch(message.messageId);
                                    if (officerMessage.editable) {
                                        officerMessage.edit({ content: `Some other officer gave <@${winnerId}> a gift`, components: [] });
                                    }
                                }
                            })
                    }
                })
            }
            fs.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
        } else {
            console.error(`interaction map was ${officerInteractionMap}, guild ID is ${guildId}`)
        }
    } else {
        console.error(`Guild id is: ${guildId}`);
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

const handleAddOrRemoveItems = async (interaction: CommandInteraction, adding: boolean) => {
    await interaction.deferReply({ ephemeral: true });
    const removedItems = interaction.options.getNumber(numberOfItemsAdded);
    const guildId = interaction.guildId;
    if (!guildId) {
        interaction.reply(notInGuildMesage);
        return;
    } else if (!removedItems) {
        interaction.reply('You didn\'t add items');
        return;
    }
    const file = fs.readFileSync(giveawayFile, 'utf-8');
    const convertedFile = JSON.parse(file) as GiveawayFile;
    const giveaway = convertedFile[guildId];
    const officers = (await bot.guilds.fetch(guildId))
        .members.cache.filter(member => member.roles.cache.filter(role => role.name === officerRoleName).size > 0);
    if (interaction.user.id !== giveaway?.startedUser || officers.get(interaction.user.id)) {
        interaction.editReply(`That's not up to you I'm telling!`);
        console.log(`${interaction.user.username} tried to remove the items!`);
        return;
    } if (adding) {
        giveaway.numberOfItems += removedItems;
    } else {
        giveaway.numberOfItems -= removedItems;
    }
    const newItemsInBank = giveaway.numberOfItems;
    fs.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
    interaction.editReply({ content: `${adding ? 'Added' : 'Removed'} ${removedItems} total items ${newItemsInBank}`, components: [] });
}