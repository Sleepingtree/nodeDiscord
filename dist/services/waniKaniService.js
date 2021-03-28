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
const node_fetch_1 = __importDefault(require("node-fetch"));
const discordLogIn_1 = __importStar(require("./discordLogIn"));
const WANIKANI_API_KEY = process.env.WANIKANI_API_KEY;
const TREE_USER_ID = process.env.TREE_USER_ID;
let lastSummery;
let reviewMessageSent = true;
const checkWaniKaniInterval = 1000 * 60;
discordLogIn_1.default.on('message', msg => {
    if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'wani')) {
        sendReviewcount();
    }
});
async function getSummery() {
    const url = "https://api.wanikani.com/v2/summary";
    let res = await node_fetch_1.default(url, {
        method: 'get',
        headers: { 'Authorization': `Bearer ${WANIKANI_API_KEY}` },
    });
    const summery = await res.json();
    if (summery) {
        lastSummery = summery;
    }
}
function getReviewCount() {
    return lastSummery === null || lastSummery === void 0 ? void 0 : lastSummery.data.reviews[0].subject_ids.length;
}
async function checkReviewCount() {
    await getSummery();
    const reviewCount = getReviewCount();
    if (reviewCount && reviewCount > 0 && !reviewMessageSent) {
        sendReviewcount();
    }
    else if (reviewCount == 0) {
        reviewMessageSent = false;
    }
}
function sendReviewcount() {
    let reviewCount = getReviewCount();
    let message;
    if (reviewCount && reviewCount > 0) {
        reviewMessageSent = true;
        let addS = reviewCount > 1 ? 's' : '';
        message = `You have ${reviewCount} review${addS} to do! がんばって`;
    }
    else {
        reviewMessageSent = false;
        message = `何もない`;
    }
    if (TREE_USER_ID) {
        discordLogIn_1.default.users.fetch(TREE_USER_ID).then(user => user.send(message));
    }
}
setInterval(() => checkReviewCount(), checkWaniKaniInterval);
//# sourceMappingURL=waniKaniService.js.map