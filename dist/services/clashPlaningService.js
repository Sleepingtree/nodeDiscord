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
Object.defineProperty(exports, "__esModule", { value: true });
const discordLogIn_1 = __importStar(require("./discordLogIn"));
const CLASH_PLANING_TEXT_CHANNEL = process.env.CLASH_PLANING_TEXT_CHANNEL;
const TREE_USER_ID = process.env.TREE_USER_ID;
discordLogIn_1.default.on('messageCreate', msg => {
    if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'clashMessage')) {
        addClashTime(msg);
    }
});
async function addClashTime(msg) {
    const message = msg.content.split("-payload ")[1];
    if (CLASH_PLANING_TEXT_CHANNEL && TREE_USER_ID && msg.author.id.toString() === TREE_USER_ID) {
        const channel = await discordLogIn_1.default.channels.fetch(CLASH_PLANING_TEXT_CHANNEL);
        const post = await channel.send(message);
        await post.react('✅');
        //yellow square
        await post.react('🟨');
        //red X
        await post.react('❌');
    }
    else {
        console.warn(`didn't post the meesage because one of thise is false 
    CLASH_PLANING_TEXT_CHANNEL:${typeof CLASH_PLANING_TEXT_CHANNEL === "undefined"}, TREE_USER_ID:${TREE_USER_ID}
    or auther == tree? ${msg.author.id.toString() === TREE_USER_ID}`);
    }
}
//# sourceMappingURL=clashPlaningService.js.map