"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNoPrize = exports.handlePrize = exports.handleEndCommand = exports.handleJoinCommand = exports.handleGiveAwayCommand = exports.noPrize = exports.giveGiveawayPrize = exports.endGiveawayButton = exports.joinGiveawayButton = exports.numberOfItemsToGiveAway = exports.numberOfItemsAdded = exports.addingMoreItemsCommand = exports.restartCommand = exports.startCommand = void 0;
const discord_js_1 = require("discord.js");
const discordLogIn_1 = __importDefault(require("../services/discordLogIn"));
const fs_1 = __importDefault(require("fs"));
exports.startCommand = 'start';
exports.restartCommand = 'restart';
exports.addingMoreItemsCommand = 'additional-prizes';
exports.numberOfItemsAdded = 'number-of-prizes';
exports.numberOfItemsToGiveAway = 'items-in-bank';
exports.joinGiveawayButton = 'joinGiveaway';
exports.endGiveawayButton = 'endGiveaway';
exports.giveGiveawayPrize = 'givePrize';
exports.noPrize = 'noPrize';
const guildRoleName = 'It lives!';
const giveawayFile = 'giveaway.json';
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
                darwOrRedrawForUser(interaction, guildGiveaway, convertedFile);
            }
        }
        else {
            darwOrRedrawForUser(interaction, guildGiveaway, convertedFile);
        }
    }
    else {
        const randomSeed = Math.random();
        console.log(`failed join button push ${randomSeed}`);
        interaction.reply({ ephemeral: true, content: `Something went wrong send tree this! > ${randomSeed}` });
    }
};
exports.handleJoinCommand = handleJoinCommand;
const darwOrRedrawForUser = (interaction, guildGiveaway, convertedFile) => {
    var _a;
    interaction.editReply(`reply with a number between 1 and ${guildGiveaway.numberOfItems}`);
    const filter = (m) => interaction.user.id === m.author.id;
    (_a = interaction.channel) === null || _a === void 0 ? void 0 : _a.awaitMessages({ filter, time: 60000, max: 1, errors: ['time'] }).then(async (messages) => {
        var _a, _b, _c;
        const rawResponse = (_a = messages.first()) === null || _a === void 0 ? void 0 : _a.content;
        const numberResponse = Number(rawResponse);
        if (numberResponse === NaN || numberResponse < 1 || numberResponse > guildGiveaway.numberOfItems) {
            interaction.followUp({ content: `You've entered: ${(_b = messages.first()) === null || _b === void 0 ? void 0 : _b.content}`, ephemeral: true });
        }
        else {
            await interaction.followUp(`You've entered: ${(_c = messages.first()) === null || _c === void 0 ? void 0 : _c.content}`);
            guildGiveaway.joinedUsers = guildGiveaway.joinedUsers.filter(user => user.userId !== interaction.user.id);
            guildGiveaway.joinedUsers.push({ userId: interaction.user.id, won: false, requestSlot: numberResponse });
            fs_1.default.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
            const startedUser = await discordLogIn_1.default.users.fetch(guildGiveaway.startedUser);
            const messageActionRow = new discord_js_1.MessageActionRow().addComponents(new discord_js_1.MessageButton().setCustomId(exports.giveGiveawayPrize)
                .setLabel(`I gave ${interaction.user.username} a prize!`)
                .setStyle('PRIMARY')
                .setEmoji('🎉')).addComponents(new discord_js_1.MessageButton().setCustomId(exports.noPrize)
                .setLabel('No prize')
                .setStyle('DANGER')
                .setEmoji('😔'));
            startedUser.send({ content: `<@${interaction.user.id}> joined the giveway asking for item  ${numberResponse} give them something nice for me!`, components: [messageActionRow] });
            interaction.editReply(`You've been entered in the giveaway with a the number ${numberResponse}. \r\n I hope you get something good!`);
        }
    }).catch(() => {
        interaction.followUp('You did not enter any input!');
    });
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
        if (interaction.message.author.id !== (giveaway === null || giveaway === void 0 ? void 0 : giveaway.startedUser)) {
            interaction.editReply(`That's not up to you I'm telling!`);
            console.log(`${interaction.user.username} tried to end the giveaway!`);
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
    //I should fix this when I have time
    const winnerId = interaction.message.content.split('<@')[1].split('>')[0];
    if ('edit' in interaction.message) {
        interaction.message.edit({ components: [] });
    }
    const ownerId = interaction.user.id;
    await interaction.deferReply({ ephemeral: true });
    const file = fs_1.default.readFileSync(giveawayFile, 'utf-8');
    const convertedFile = JSON.parse(file);
    const guildId = Object.keys(convertedFile).find(id => { var _a; return ((_a = convertedFile[id]) === null || _a === void 0 ? void 0 : _a.startedUser) === ownerId; });
    if (guildId) {
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
        }
        fs_1.default.writeFileSync(giveawayFile, JSON.stringify(convertedFile, null, 2));
        interaction.editReply({ content: `I took all the credit for the gift 😊 there's ${users === null || users === void 0 ? void 0 : users.numberOfItems} left in the bank!`, components: [] });
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
//# sourceMappingURL=giveawayService.js.map