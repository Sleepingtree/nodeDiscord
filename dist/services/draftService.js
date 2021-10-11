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
const blueTeamEmoji = '🔵';
const redTeamEmoji = '🔴';
const draftWait = 60000;
discordLogIn_1.default.on('messageCreate', msg => {
    if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'draft')) {
        createDraftPost(msg);
    }
});
async function createDraftPost(msg) {
    const responseMsg = 'Waiting for captains, click which captain you want to be.';
    const post = await msg.channel.send(responseMsg);
    //blue
    post.react(blueTeamEmoji);
    //red
    post.react(redTeamEmoji);
    const urls = draft();
    console.log(urls);
    const redFilter = (reaction, user) => {
        return redTeamEmoji === reaction.emoji.name && user.id != post.author.id;
    };
    const blueFilter = (reaction, user) => {
        return blueTeamEmoji === reaction.emoji.name && user.id != post.author.id;
    };
    const bluePromise = sendLink(post, blueFilter);
    const redPromise = sendLink(post, redFilter);
    Promise.all([redPromise, bluePromise, urls]).then((values) => {
        handleCaptianPromise(values[0], post, values[2][1], discordLogIn_1.default);
        handleCaptianPromise(values[1], post, values[2][0], discordLogIn_1.default);
        msg.channel.send("Draft link: " + values[2][2]);
    });
    setTimeout(post.delete, draftWait);
}
function sendLink(post, filter) {
    return post.awaitReactions({ filter: filter, max: 1, time: draftWait, errors: ['time'] });
}
function handleCaptianPromise(collection, post, url, bot) {
    const reaction = collection.first();
    const teamCaptaianId = reaction === null || reaction === void 0 ? void 0 : reaction.users.cache.filter(user => user.id != post.author.id).values().next().value.id;
    bot.users.fetch(teamCaptaianId).then(user => user.send("Draft link:" + url));
}
async function draft() {
    const body = { "team1Name": "blue", "team2Name": "red", "matchName": "match" };
    console.log(JSON.stringify(body));
    const response = await (0, node_fetch_1.default)('http://prodraft.leagueoflegends.com/draft', {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
        .then(res => res.json());
    console.log(response);
    let urls = [];
    //blue team
    urls.push('http://prodraft.leagueoflegends.com/?draft=' + response.id + '&auth=' + response.auth[0] + '&locale=en_US');
    //red team
    urls.push('http://prodraft.leagueoflegends.com/?draft=' + response.id + '&auth=' + response.auth[1] + '&locale=en_US');
    //spectator
    urls.push('http://prodraft.leagueoflegends.com/?draft=' + response.id + '&locale=en_US');
    return urls;
}
//# sourceMappingURL=draftService.js.map