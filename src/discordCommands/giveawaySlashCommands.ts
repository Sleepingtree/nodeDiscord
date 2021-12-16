import { SlashCommandBuilder } from "@discordjs/builders";
import {
    handleGiveAwayCommand,
    startCommand,
    restartCommand,
    joinGiveawayButton,
    endGiveawayButton,
    handleJoinCommand,
    handleEndCommand,
    handlePrize,
    giveGiveawayPrize,
    noPrize,
    handleNoPrize,
    numberOfItemsToGiveAway,
    addingMoreItemsCommand,
    numberOfItemsAdded,
    subtractingItemsCommnad
} from "../services/giveawayService";
import CommandModel from "../model/commandModel";

class giveawaySlashCommands implements CommandModel {
    commands = [
        {
            slashCommand: new SlashCommandBuilder()
                .setName('giveaway')
                .setDescription('making it rain')
                .addSubcommand(subcommand =>
                    subcommand.setName(startCommand)
                        .setDescription('starts a guild giveaway')
                        .addNumberOption(option => option.setName(numberOfItemsToGiveAway).setDescription('The number of items in the bank at the moment').setRequired(true))
                ).addSubcommand(subcommand =>
                    subcommand.setName(restartCommand)
                        .setDescription('clears all the winners to add new ones'))
                .addSubcommand(subcommand =>
                    subcommand.setName(addingMoreItemsCommand)
                        .setDescription('Adds more items to the bank in case you bought more')
                        .addNumberOption(option => option.setName(numberOfItemsAdded).setDescription('The number of items being added to the giveaway').setRequired(true))
                ).addSubcommand(subcommand =>
                    subcommand.setName(subtractingItemsCommnad)
                        .setDescription('Removes items from the bank in case the count is off')
                        .addNumberOption(option => option.setName(numberOfItemsAdded).setDescription('The number of items being removed from the giveaway').setRequired(true))
                ),
            cb: handleGiveAwayCommand,
            needsUpdate: false
        }
    ];
    buttonCommands = [
        {
            name: joinGiveawayButton,
            cb: handleJoinCommand
        },
        {
            name: endGiveawayButton,
            cb: handleEndCommand
        },
        {
            name: giveGiveawayPrize,
            cb: handlePrize
        },
        {
            name: noPrize,
            cb: handleNoPrize
        }
    ]
}
export default new giveawaySlashCommands();