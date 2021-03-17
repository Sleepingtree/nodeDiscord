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
exports.playYoutube = void 0;
const ytdl_core_1 = __importDefault(require("ytdl-core"));
const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
let voiceConnection = null;
function playYoutube(bot, youTube) {
    return __awaiter(this, void 0, void 0, function* () {
        if (voiceConnection === null) {
            yield getConnection(bot);
        }
        voiceConnection.play(ytdl_core_1.default(youTube, { quality: 'highestaudio' }), { volume: 0.05 })
            .on("finish", () => {
            voiceConnection.disconnect();
            voiceConnection == null;
        })
            .on("error", error => {
            console.error(error);
            voiceConnection.disconnect();
            voiceConnection = null;
        });
    });
}
exports.playYoutube = playYoutube;
function getConnection(bot) {
    return __awaiter(this, void 0, void 0, function* () {
        const channel = yield bot.channels.fetch(VOICE_CHANNEL_ID);
        voiceConnection = yield channel.join();
    });
}
//# sourceMappingURL=youtubeService.js.map