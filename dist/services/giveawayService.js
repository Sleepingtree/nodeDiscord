"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNoPrize = exports.handlePrize = exports.handleEndCommand = exports.handleJoinCommand = exports.handleGiveAwayCommand = exports.noPrize = exports.giveGiveawayPrize = exports.endGiveawayButton = exports.joinGiveawayButton = exports.numberOfItemsToGiveAway = exports.numberOfItemsAdded = exports.subtractingItemsCommnad = exports.addingMoreItemsCommand = exports.restartCommand = exports.startCommand = void 0;
const discord_js_1 = require("discord.js");
const discordLogIn_1 = __importDefault(require("../services/discordLogIn"));
const fs_1 = __importDefault(require("fs"));
exports.startCommand = 'start';
exports.restartCommand = 'restart';
exports.addingMoreItemsCommand = 'additional-prizes';
exports.subtractingItemsCommnad = 'prizes-to-remove';
exports.numberOfItemsAdded = 'number-of-prizes';
exports.numberOfItemsToGiveAway = 'items-in-bank';
exports.joinGiveawayButton = 'joinGiveaway';
exports.endGiveawayButton = 'endGiveaway';
exports.giveGiveawayPrize = 'givePrize';
exports.noPrize = 'noPrize';
const guildRoleName = 'It lives!';
const officerRoleName = 'Officer';
const giveawayFile = 'giveaway.json';
const officerMessageMap = {};
const notInGuildMesage = { ephemeral: true, content: 'You must be in a discord server to use this!' };
const handleGiveAwayCommand = async (interaction) => {
    const realCommand = interaction.options.getSubcommand();
    if (realCommand === exports.startCommand) {
        handleStart(interaction);
    }
    else if (realCommand === exports.restartCommand) {
        handleRestartCommand(interaction);
    }
    else if (realCommand === exports.addingMoreItemsCommand) {
        handleAddOrRemoveItems(interaction, true);
    }
    else if (realCommand === exports.subtractingItemsCommnad) {
        handleAddOrRemoveItems(interaction, false);
    }
    else {
        console.log('Unhandled giveAway command');
    }
};
exports.handleGiveAwayCommand = handleGiveAwayCommand;
const handleStart = async (interaction) => {
    const guildId = interaction.guildId;
    const startingItemCount = interaction.options.getNumber(exports.numberOfItemsToGiveAway);
    if (!guildId || !startingItemCount) {
        interaction.reply(notInGuildMesage);
        return;
    }
    await interaction.deferReply();
    const file = fs_1.default.readFileSync(giveawayFile, 'utf8');
    const convertedFile = JSON.parse(file);
    const messageActionRow = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setCustomId(exports.joinGiveawayButton)
        .setLabel('Join giveaway')
        .setStyle('PRIMARY')
        .setEmoji('🎉')).addComponents(new discord_js_1.MessageButton().setCustomId(exports.endGiveawayButton)
        .setLabel('end giveaway')
        .setStyle('DANGER'));
    convertedFile[guildId] = {
        startedUser: interaction.user.id,
        numberOfItems: startingItemCount,
        joinedUsers: []
    };
    fs_1.default.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
    interaction.editReply({
        content: 'Raffle started! click on join to get your phat stacks',
        components: [messageActionRow]
    });
};
const handleJoinCommand = async (interaction) => {
    var _a, _b;
    const parentInteraction = interaction.message;
    if ('guildId' in parentInteraction) {
        const guildId = parentInteraction.guildId;
        if (!guildId) {
            interaction.reply(notInGuildMesage);
            return;
        }
        await interaction.deferReply({ ephemeral: true });
        const roleId = (_a = (await discordLogIn_1.default.guilds.fetch(guildId)
            .then(guild => guild.roles)
            .then(roleMan => roleMan.fetch()))
            .find(role => role.name === guildRoleName)) === null || _a === void 0 ? void 0 : _a.id;
        const roles = (_b = interaction.member) === null || _b === void 0 ? void 0 : _b.roles;
        if (!roles || !roleId) {
            console.error(`can't find role for user. roles: ${roles} roleId: ${roleId}`);
            return;
        }
        const isGuildMember = roles instanceof Array ?
            roles.find((role) => role === roleId) !== undefined :
            roles.cache.has(roleId);
        if (!isGuildMember) {
            interaction.editReply('Sorry Guild members only!');
            return;
        }
        const file = fs_1.default.readFileSync(giveawayFile, 'utf-8');
        const convertedFile = JSON.parse(file);
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
                interaction.editReply('You have already won something!');
            }
            else {
                darwOrRedrawForUser(interaction, guildGiveaway, convertedFile, guildId);
            }
        }
        else {
            darwOrRedrawForUser(interaction, guildGiveaway, convertedFile, guildId);
        }
    }
    else {
        const randomSeed = Math.random();
        console.log(`failed join button push ${randomSeed}`);
        interaction.reply({ ephemeral: true, content: `Something went wrong send tree this! > ${randomSeed}` });
    }
};
exports.handleJoinCommand = handleJoinCommand;
const darwOrRedrawForUser = async (interaction, guildGiveaway, convertedFile, guildId) => {
    try {
        const dmMessage = await interaction.user.send(`reply with a number between 1 and ${guildGiveaway.numberOfItems}`);
        interaction.followUp({ content: 'I slid into your DM, please reply there!', ephemeral: true });
        const filter = (m) => interaction.user.id === m.author.id;
        const officers = (await discordLogIn_1.default.guilds.fetch(guildId))
            .members.cache.filter(member => member.roles.cache.filter(role => role.name === officerRoleName).size > 0);
        dmMessage.channel.awaitMessages({ filter, time: 60000, max: 1, errors: ['time'] })
            .then(async (messages) => {
            var _a;
            const rawResponse = (_a = messages.first()) === null || _a === void 0 ? void 0 : _a.content;
            const numberResponse = Number(rawResponse === null || rawResponse === void 0 ? void 0 : rawResponse.trim());
            if (numberResponse === NaN || numberResponse < 1 || numberResponse > guildGiveaway.numberOfItems) {
                interaction.followUp({ content: `You did not enter a number, please join again with only a number`, ephemeral: true });
            }
            else {
                guildGiveaway.joinedUsers = guildGiveaway.joinedUsers.filter(user => user.userId !== interaction.user.id);
                guildGiveaway.joinedUsers.push({ userId: interaction.user.id, won: false, requestSlot: numberResponse });
                fs_1.default.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
                const messageActionRow = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setCustomId(exports.giveGiveawayPrize)
                    .setLabel(`I gave ${interaction.user.username} a prize!`)
                    .setStyle('PRIMARY')
                    .setEmoji('🎉')).addComponents(new discord_js_1.MessageButton().setCustomId(exports.noPrize)
                    .setLabel('No prize')
                    .setStyle('DANGER')
                    .setEmoji('😔'));
                officers.forEach(async (officer) => {
                    console.log(`sending message to ${officer.user.username}`);
                    const officerMessage = await officer.send({
                        content: `<@${interaction.user.id}> joined the giveway asking for item  ${numberResponse} give them something nice for me! serverID:${guildId}`,
                        components: [messageActionRow]
                    });
                    let otherOfficerMessages = officerMessageMap[guildId];
                    if (otherOfficerMessages) {
                        let userMessageMap = otherOfficerMessages[interaction.user.id];
                        if (userMessageMap) {
                            userMessageMap.officerMessages.push({ messageId: officerMessage.id, dmChannelId: officerMessage.channelId });
                        }
                        else {
                            userMessageMap = { officerMessages: [{ messageId: officerMessage.id, dmChannelId: officerMessage.channelId }] };
                        }
                        otherOfficerMessages[interaction.user.id] = userMessageMap;
                    }
                    else {
                        otherOfficerMessages = {
                            [interaction.user.id]: {
                                officerMessages: [
                                    { messageId: officerMessage.id, dmChannelId: officerMessage.channelId }
                                ]
                            }
                        };
                    }
                    officerMessageMap[guildId] = otherOfficerMessages;
                });
                const reponseMesage = `You've been entered in the giveaway with a the number ${numberResponse}. \r\n I hope you get something good!`;
                interaction.followUp({ content: reponseMesage, ephemeral: true });
                interaction.user.send(reponseMesage);
            }
        })
            .catch(() => {
            const response = 'Are you still there? If you are please click join again!';
            interaction.followUp({ content: response, ephemeral: true });
            interaction.user.send(response);
        });
    }
    catch (error) {
        interaction.followUp({ content: 'I tried to slide into your DMs, but you have me blocked! Please let me in I promise not to spam you.', ephemeral: true });
        if (error instanceof Error) {
            console.error(error.name);
            console.error(error.message);
        }
        else {
            console.error(error);
        }
    }
};
const handleEndCommand = async (interaction) => {
    const parentInteraction = interaction.message;
    await interaction.deferReply({ ephemeral: true });
    if ('guildId' in parentInteraction) {
        const guildId = parentInteraction.guildId;
        if (!guildId) {
            interaction.reply(notInGuildMesage);
            return;
        }
        const file = fs_1.default.readFileSync(giveawayFile, 'utf-8');
        const convertedFile = JSON.parse(file);
        const giveaway = convertedFile[guildId];
        if (interaction.user.id !== (giveaway === null || giveaway === void 0 ? void 0 : giveaway.startedUser)) {
            interaction.editReply(`That's not up to you I'm telling!`);
            console.log(`${interaction.user.username} tried to end the giveaway!`);
            return;
        }
        const replyMessage = `Give away is over with ${giveaway === null || giveaway === void 0 ? void 0 : giveaway.joinedUsers.filter(user => user.won).length} winners out of ${giveaway === null || giveaway === void 0 ? void 0 : giveaway.joinedUsers.length} players`;
        convertedFile[guildId] = undefined;
        fs_1.default.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
        await parentInteraction.edit({ content: replyMessage, components: [] });
        interaction.editReply({ content: 'Give away has ended', components: [] });
    }
};
exports.handleEndCommand = handleEndCommand;
const handleRestartCommand = async (interaction) => {
    const guildId = interaction.guildId;
    if (!guildId) {
        interaction.reply(notInGuildMesage);
        return;
    }
    await interaction.deferReply();
    const file = fs_1.default.readFileSync(giveawayFile, 'utf-8');
    const convertedFile = JSON.parse(file);
    const giveaway = convertedFile[guildId];
    let reply = { ephemeral: true, content: "You can't restart the giveaway" };
    if (giveaway && giveaway.startedUser === interaction.user.id) {
        giveaway.joinedUsers = [];
        reply = { ephemeral: true, content: 'Winners have been reset' };
    }
    fs_1.default.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
    interaction.editReply(reply);
};
const handlePrize = async (interaction) => {
    var _a;
    //I should fix this when I have time
    const winnerId = interaction.message.content.split('<@')[1].split('>')[0];
    if ('edit' in interaction.message) {
        interaction.message.edit({ components: [] });
    }
    await interaction.deferReply({ ephemeral: true });
    const file = fs_1.default.readFileSync(giveawayFile, 'utf-8');
    const convertedFile = JSON.parse(file);
    const guildId = interaction.message.content.split('serverID:')[1];
    if (guildId) {
        const officerInteractionMap = officerMessageMap[guildId];
        if (officerInteractionMap) {
            const users = convertedFile[guildId];
            if (users) {
                const userIndex = users.joinedUsers.findIndex(user => user.userId === winnerId);
                if (users.joinedUsers[userIndex]) {
                    const user = await discordLogIn_1.default.users.fetch(users.joinedUsers[userIndex].userId);
                    user.send('Hope you enjoy your gift!');
                    users.joinedUsers[userIndex].won = true;
                    --users.numberOfItems;
                    convertedFile[guildId] = users;
                }
                interaction.editReply({ content: `I took all the credit for the gift 😊 \r\n there's ${users === null || users === void 0 ? void 0 : users.numberOfItems} left in the bank!`, components: [] });
                (_a = officerInteractionMap[winnerId]) === null || _a === void 0 ? void 0 : _a.officerMessages.forEach(message => {
                    if (message.dmChannelId !== interaction.channelId) {
                        discordLogIn_1.default.channels.fetch(message.dmChannelId)
                            .then(async (channel) => {
                            if (channel === null || channel === void 0 ? void 0 : channel.isText()) {
                                const officerMessage = await channel.messages.fetch(message.messageId);
                                if (officerMessage.editable) {
                                    officerMessage.edit({ content: `Some other officer gave <@${winnerId}> a gift`, components: [] });
                                }
                            }
                        });
                    }
                });
            }
            fs_1.default.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
        }
        else {
            console.error(`interaction map was ${officerInteractionMap}, guild ID is ${guildId}`);
        }
    }
    else {
        console.error(`Guild id is: ${guildId}`);
    }
};
exports.handlePrize = handlePrize;
const handleNoPrize = async (interaction) => {
    await interaction.deferReply({ ephemeral: true });
    //I should fix this when I have time
    const loserId = interaction.message.content.split('<@')[1].split('>')[0];
    if ('edit' in interaction.message) {
        interaction.message.edit({ components: [] });
    }
    console.log(interaction.message.content);
    const user = await discordLogIn_1.default.users.fetch(loserId);
    user.send('Sorry no gift for you');
    interaction.editReply({ content: 'Why did you make me send them bad news?', components: [] });
};
exports.handleNoPrize = handleNoPrize;
const handleAddOrRemoveItems = async (interaction, adding) => {
    await interaction.deferReply({ ephemeral: true });
    const removedItems = interaction.options.getNumber(exports.numberOfItemsAdded);
    const guildId = interaction.guildId;
    if (!guildId) {
        interaction.reply(notInGuildMesage);
        return;
    }
    else if (!removedItems) {
        interaction.reply('You didn\'t add items');
        return;
    }
    const file = fs_1.default.readFileSync(giveawayFile, 'utf-8');
    const convertedFile = JSON.parse(file);
    const giveaway = convertedFile[guildId];
    if (interaction.user.id !== (giveaway === null || giveaway === void 0 ? void 0 : giveaway.startedUser)) {
        interaction.editReply(`That's not up to you I'm telling!`);
        console.log(`${interaction.user.username} tried to remove the items!`);
        return;
    }
    if (adding) {
        giveaway.numberOfItems += removedItems;
    }
    else {
        giveaway.numberOfItems -= removedItems;
    }
    const newItemsInBank = giveaway.numberOfItems;
    fs_1.default.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
    interaction.editReply({ content: `${adding ? 'Added' : 'Removed'} ${removedItems} total items ${newItemsInBank}`, components: [] });
};
//# sourceMappingURL=giveawayService.js.map