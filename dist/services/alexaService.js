"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAndRespondWhosOnline = void 0;
const discord_js_1 = require("discord.js");
const node_fetch_1 = __importDefault(require("node-fetch"));
const discordLogIn_1 = __importStar(require("./discordLogIn"));
const NOTIFY_ME_KEY = process.env.NOTIFY_ME_KEY;
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const THE_FOREST_ID = process.env.THE_FOREST_ID;
const maxResendTime = 1000 * 60 * 60 * 6; //6hours
const urlBase = 'https://api.notifymyecho.com/v1/NotifyMe';
let lastSent = null;
discordLogIn_1.default.on('voiceStateUpdate', (_oldState, newState) => {
    setTimeout(() => checkIfSateIsSame(newState), 1000 * 60 * 5);
});
async function getAndRespondWhosOnline(channelId) {
    const channelIdToUse = channelId == null ? VOICE_CHANNEL_ID : channelId;
    const users = await discordLogIn_1.whosOnline(channelIdToUse);
    let notification = `users online are ${users}`;
    if (users.length == 0) {
        notification = 'no one is online';
    }
    if (channelId != null) {
        const channelName = await discordLogIn_1.getChannelNameFromId(channelId);
        notification += ` on channel ${channelName}`;
    }
    const body = {
        "notification": notification,
        "accessCode": NOTIFY_ME_KEY
    };
    node_fetch_1.default(urlBase, {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => res.json())
        .then(console.log)
        .catch(err => console.log(err));
    console.log(`sent message: ${notification}`);
}
exports.getAndRespondWhosOnline = getAndRespondWhosOnline;
async function checkToSendWhosOnline(channelId) {
    const users = await discordLogIn_1.whosOnline(channelId != null ? channelId : VOICE_CHANNEL_ID);
    if (!users.includes('sleepingtree') && (lastSent == null || lastSent + maxResendTime < Date.now())) {
        lastSent = Date.now();
        return getAndRespondWhosOnline(channelId)
            .then(() => true)
            .catch(err => console.log(err));
    }
    else {
        console.log('false');
        return false;
    }
}
async function checkIfSateIsSame(oldState) {
    if (oldState.channelID && oldState.guild != null && oldState.guild.id == THE_FOREST_ID) {
        const channel = await discordLogIn_1.default.channels.fetch(oldState.channelID);
        if (channel instanceof discord_js_1.GuildChannel) {
            if (oldState.member) {
                if (channel.members.has(oldState.member.id)) {
                    checkToSendWhosOnline(oldState.channelID);
                }
            }
        }
        else {
            console.warn(`Channel ${oldState.channelID} is not a voice channel`);
        }
    }
}
//# sourceMappingURL=alexaService.js.map