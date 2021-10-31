import { SlashCommandBuilder } from "@discordjs/builders";
import {
    handleGiveAwayCommand,
    startCommand,
    restartCommand,
    joinGiveawayButton,
    endGiveawayButton,
    handleJoinCommand
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
                        .setDescription('starts a raffle')
                ).addSubcommand(subcommand =>
                    subcommand.setName(restartCommand)
                        .setDescription('clears all the winners to add new ones')),
            cb: handleGiveAwayCommand,
            needsUpdate: false
        }
    ];
    buttonCommands = [
        {
            name: joinGiveawayButton,
            cb: handleJoinCommand
        }
    ]
}
export default new giveawaySlashCommands();