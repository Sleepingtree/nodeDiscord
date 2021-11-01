import { ButtonInteraction, CommandInteraction } from "discord.js";
export declare const startCommand = "start";
export declare const restartCommand = "restart";
export declare const joinGiveawayButton = "joinGiveaway";
export declare const endGiveawayButton = "endGiveaway";
export declare const giveGiveawayPrize = "givePrize";
export declare const noPrize = "noPrize";
export declare const handleGiveAwayCommand: (interaction: CommandInteraction) => Promise<void>;
export declare const handleJoinCommand: (interaction: ButtonInteraction) => Promise<void>;
export declare const handleEndCommand: (interaction: ButtonInteraction) => Promise<void>;
export declare const handlePrize: (interaction: ButtonInteraction) => Promise<void>;
export declare const handleNoPrize: (interaction: ButtonInteraction) => Promise<void>;
