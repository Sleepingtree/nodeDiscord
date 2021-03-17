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
Object.defineProperty(exports, "__esModule", { value: true });
exports.addClashTime = void 0;
const CLASH_PLANING_TEXT_CHANNEL = process.env.CLASH_PLANING_TEXT_CHANNEL;
function addClashTime(bot, msg) {
    return __awaiter(this, void 0, void 0, function* () {
        let message = msg.content.split("-payload ")[1];
        let channel = yield bot.channels.fetch(CLASH_PLANING_TEXT_CHANNEL);
        const post = yield channel.send(message);
        yield post.react('✅');
        //yellow square
        yield post.react('🟨');
        //red X
        yield post.react('❌');
    });
}
exports.addClashTime = addClashTime;
//# sourceMappingURL=clashPlaningService.js.map