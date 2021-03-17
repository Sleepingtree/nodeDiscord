"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkToSendWhosOnline = exports.getAndRespondWhosOnline = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const discordLogIn_1 = require("./discordLogIn");
const NOTIFY_ME_KEY = process.env.NOTIFY_ME_KEY;
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const maxResendTime = 1000 * 60 * 60 * 6; //6hours
const urlBase = 'https://api.notifymyecho.com/v1/NotifyMe';
let lastSent = null;
function getAndRespondWhosOnline(channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        const channelIdToUse = channelId == null ? VOICE_CHANNEL_ID : channelId;
        const users = yield discordLogIn_1.whosOnline(channelIdToUse);
        let notification = `users online are ${users}`;
        if (users.length == 0) {
            notification = 'no one is online';
        }
        if (channelId != null) {
            const channelName = yield discordLogIn_1.getChannelNameFromId(channelId);
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
    });
}
exports.getAndRespondWhosOnline = getAndRespondWhosOnline;
function checkToSendWhosOnline(channelId) {
    return __awaiter(this, void 0, void 0, function* () {
        const users = yield discordLogIn_1.whosOnline(channelId != null ? channelId : VOICE_CHANNEL_ID);
        if (!users.includes('sleepingtree') && (lastSent == null || lastSent + maxResendTime < Date.now())) {
            lastSent = Date.now();
            return getAndRespondWhosOnline(channelId)
                .then(data => true)
                .catch(err => console.log(err));
        }
        else {
            console.log('false');
            return false;
        }
    });
}
exports.checkToSendWhosOnline = checkToSendWhosOnline;
//# sourceMappingURL=alexaService.js.map