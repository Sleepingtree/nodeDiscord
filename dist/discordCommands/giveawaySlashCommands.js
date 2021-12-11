"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const giveawayService_1 = require("../services/giveawayService");
class giveawaySlashCommands {
    constructor() {
        this.commands = [
            {
                slashCommand: new builders_1.SlashCommandBuilder()
                    .setName('giveaway')
                    .setDescription('making it rain')
                    .addSubcommand(subcommand => subcommand.setName(giveawayService_1.startCommand)
                    .setDescription('starts a guild giveaway')
                    .addNumberOption(option => option.setName(giveawayService_1.numberOfItemsToGiveAway).setDescription('The number of items in the bank at the moment').setRequired(true))).addSubcommand(subcommand => subcommand.setName(giveawayService_1.restartCommand)
                    .setDescription('clears all the winners to add new ones'))
                    .addSubcommand(subcommand => subcommand.setName(giveawayService_1.addingMoreItemsCommand)
                    .setDescription('clears all the winners to add new ones')
                    .addNumberOption(option => option.setName(giveawayService_1.numberOfItemsAdded).setDescription('The number of items being added to the giveaway').setRequired(true))),
                cb: giveawayService_1.handleGiveAwayCommand,
                needsUpdate: true
            }
        ];
        this.buttonCommands = [
            {
                name: giveawayService_1.joinGiveawayButton,
                cb: giveawayService_1.handleJoinCommand
            },
            {
                name: giveawayService_1.endGiveawayButton,
                cb: giveawayService_1.handleEndCommand
            },
            {
                name: giveawayService_1.giveGiveawayPrize,
                cb: giveawayService_1.handlePrize
            },
            {
                name: giveawayService_1.noPrize,
                cb: giveawayService_1.handleNoPrize
            }
        ];
    }
}
exports.default = new giveawaySlashCommands();
//# sourceMappingURL=giveawaySlashCommands.js.map