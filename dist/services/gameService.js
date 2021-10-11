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
exports.getTeamMessage = void 0;
const twitchService = __importStar(require("./twitchService"));
const fs_1 = __importDefault(require("fs"));
const discord_js_1 = require("discord.js");
const discordLogIn_1 = __importStar(require("./discordLogIn"));
const mmrFile_1 = __importDefault(require("../model/mmrFile"));
const TREE_USER_ID = process.env.TREE_USER_ID;
const RED_TEAM_VOICE_CHANNEL_ID = process.env.RED_TEAM_VOICE_CHANNEL;
const BLUE_TEAM_VOICE_CHANNEL_ID = process.env.BLUE_TEAM_VOICE_CHANNEL;
const MMR_CHANGE_WEIGHT = 100;
const RANK_GAP = 100;
//This defualts gold to default mmr
const BRONZE_STARTING_POINT = mmrFile_1.default.DEFAULT_MMR - 2 * RANK_GAP;
const mmrFileNme = 'mmr.json';
let usersInGame = [];
let redTeam = new Array();
let blueTeam = new Array();
let userNameMap = new Map();
let GAME_NAME;
let jsonFile;
let redTeamMmr = 0;
let blueTeamMmr = 0;
let startingChannel;
discordLogIn_1.default.on('messageCreate', msg => {
    if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'startGame')) {
        startGame(msg);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'gameStart')) {
        msg.channel.send("It's " + discordLogIn_1.BOT_PREFIX + 'startGame ... バカ...');
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'cancelGame')) {
        endGame(msg, false);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'redWins')) {
        endGame(msg, true, true);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'blueWins')) {
        endGame(msg, true, false);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'mmr')) {
        checkMmr(msg);
    }
    else if (msg.content.startsWith(discordLogIn_1.BOT_PREFIX + 'map')) {
        pickMap(msg);
    }
});
async function startGame(msg) {
    var _a, _b;
    if (msg.member) {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel || (voiceChannel === null || voiceChannel === void 0 ? void 0 : voiceChannel.type) === "GUILD_STAGE_VOICE") {
            msg.channel.send(`Must be in a voice channel to start a game`);
            return;
        }
        else {
            startingChannel = voiceChannel;
        }
        try {
            const file = fs_1.default.readFileSync(mmrFileNme, 'utf8');
            jsonFile = new mmrFile_1.default(file);
        }
        catch {
            console.warn(`mmrFile in path ${mmrFileNme} does not exist making new file`);
            jsonFile = new mmrFile_1.default();
        }
        const useMoonRunes = msg.member.id === TREE_USER_ID;
        if (GAME_NAME != null) {
            msg.channel.send(`game already started call !cancelGame first or !redWins !blueWins if done`);
            return;
        }
        const userGameName = (_b = (_a = msg.member.presence) === null || _a === void 0 ? void 0 : _a.activities.find(activity => activity.type === 'PLAYING')) === null || _b === void 0 ? void 0 : _b.name;
        if (userGameName) {
            GAME_NAME = userGameName;
            console.log(`${jsonFile}`);
            if (msg.content.includes("-manual")) {
                await makeTeamsManual(discordLogIn_1.default, userGameName);
            }
            else {
                console.log("in else");
                if (voiceChannel && GAME_NAME && jsonFile) {
                    voiceChannel.members
                        .each(member => {
                        usersInGame.push(member.id);
                        userNameMap.set(member.id, member.user.username);
                    });
                    console.log(voiceChannel.members);
                    //Highest mmr First
                    console.log(usersInGame);
                    usersInGame.sort((a, b) => userCompairator(a, b, userGameName));
                    makeTeams(userGameName);
                    moveUsers(redTeam, voiceChannel);
                }
            }
        }
        else {
            if (useMoonRunes) {
                msg.channel.send('ゲームの中にありません');
            }
            else {
                msg.channel.send(`You are not in a game. Please make sure discord is broadcasting your game`);
            }
            return;
        }
        if (usersInGame.length == 0) {
            if (useMoonRunes) {
                msg.channel.send(`Please join the general voice channel first, or use the -manual command while you are in the team channels`);
            }
            else {
                msg.channel.send(`チャンネルは誰もない`);
            }
        }
        else {
            const displayMessage = getTeamMessage(true, msg);
            msg.channel.send(displayMessage);
            twitchService.sendMessage(displayMessage);
        }
    }
}
function userCompairator(a, b, userGameName) {
    let bUser = jsonFile.getUsersMMR(userGameName, b);
    let aUser = jsonFile.getUsersMMR(userGameName, a);
    return bUser - aUser;
}
function getTeamMessage(start, msg) {
    if (GAME_NAME == null) {
        return 'No in house game started';
    }
    let gameMessage;
    if (start != null && start) {
        gameMessage = `Started game of ` + GAME_NAME;
    }
    else {
        gameMessage = `Tree is playing a game of ` + GAME_NAME;
    }
    if (GAME_NAME == 'VALORANT' && msg != null) {
        gameMessage += ' on map: ' + pickMap(msg, true);
    }
    let redTeamPrintUsers = "";
    redTeam.forEach(id => {
        console.log(id);
        if (redTeamPrintUsers != null) {
            redTeamPrintUsers += ", ";
        }
        redTeamPrintUsers += userNameMap.get(id) + " ";
    });
    let blueTeamPrintUsers = "";
    blueTeam.forEach(id => {
        console.log(id);
        if (blueTeamPrintUsers != null) {
            blueTeamPrintUsers += ", ";
        }
        blueTeamPrintUsers += userNameMap.get(id) + " ";
    });
    const displayMessage = gameMessage + '\r\n' + 'Red team' + redTeamPrintUsers + '\r\n' + 'Blue team' + blueTeamPrintUsers;
    return displayMessage;
}
exports.getTeamMessage = getTeamMessage;
async function checkMmr(msg) {
    const file = fs_1.default.readFileSync(mmrFileNme, 'utf8');
    const translatedFile = JSON.parse(file);
    let message = '';
    Object.keys(translatedFile).forEach(key => {
        if (key != 'metaData') {
            if (translatedFile[key][msg.author.id] != null) {
                if (message == '') {
                    message = 'Your mmr ' + msg.author.username + ': ';
                }
                message += '\r\n' + key + ': ' + convertUserMMRtoDisplayMMR(translatedFile[key][msg.author.id]);
                console.log(message);
            }
        }
    });
    if (message == '') {
        msg.channel.send('No MMR on file');
    }
    else {
        msg.channel.send(message);
    }
}
function convertUserMMRtoDisplayMMR(trueMMR) {
    let mmrFloorMap = new Map();
    let retVal = '';
    //make list of names then add points
    const rankNames = ['Bronze', 'Silver', 'Gold', 'Plat', 'Diamond', 'Masters'];
    let rankfloor = BRONZE_STARTING_POINT;
    mmrFloorMap.set('You are trying', 0);
    rankNames.forEach(name => {
        mmrFloorMap.set(name, rankfloor);
        rankfloor += RANK_GAP;
    });
    //maps in JS keep put order when using string keys
    console.log(Object.keys(mmrFloorMap));
    let lastKey;
    for (let [key, value] of mmrFloorMap) {
        if (trueMMR >= value) {
            lastKey = key;
            continue;
        }
        let pointsOverMin = trueMMR - mmrFloorMap.get(lastKey);
        let relativePoints = Math.floor(pointsOverMin / RANK_GAP * 100);
        if (lastKey == 'You are trying') {
            retVal = lastKey + ' with ' + relativePoints + ' out of ' + (100 * (BRONZE_STARTING_POINT / RANK_GAP)) + ' points to rank up';
        }
        else {
            retVal = lastKey + ' with ' + relativePoints + ' out of 100 points to rank up';
        }
        break;
    }
    if (retVal == '') {
        let pointsOverMin = trueMMR - mmrFloorMap.get(lastKey);
        let relativePoints = Math.floor(pointsOverMin / 15 * 100);
        retVal = lastKey + ' with ' + relativePoints + ' points';
    }
    return retVal;
}
function moveUsers(redTeamUser, channel) {
    if (!RED_TEAM_VOICE_CHANNEL_ID) {
        console.log("RED_TEAM_VOICE_CHANNEL_ID not defined!");
        return;
    }
    if (!BLUE_TEAM_VOICE_CHANNEL_ID) {
        console.log("BLUE_TEAM_VOICE_CHANNEL_ID not defined!");
        return;
    }
    channel.members
        .each(member => {
        if (redTeamUser.filter(id => id == member.id).length > 0) {
            member.voice.setChannel(RED_TEAM_VOICE_CHANNEL_ID);
        }
        else {
            member.voice.setChannel(BLUE_TEAM_VOICE_CHANNEL_ID);
        }
    });
}
async function moveUsersBack(bot) {
    if (!RED_TEAM_VOICE_CHANNEL_ID) {
        console.log("RED_TEAM_VOICE_CHANNEL_ID not defined!");
        return;
    }
    if (!BLUE_TEAM_VOICE_CHANNEL_ID) {
        console.log("BLUE_TEAM_VOICE_CHANNEL_ID not defined!");
        return;
    }
    const blueTeamChannel = await bot.channels.fetch(BLUE_TEAM_VOICE_CHANNEL_ID);
    if (blueTeamChannel instanceof discord_js_1.VoiceChannel) {
        blueTeamChannel.members.each(member => {
            member.voice.setChannel(startingChannel);
        });
    }
    else {
        console.error(`BLUE_TEAM_VOICE_CHANNEL_ID:${BLUE_TEAM_VOICE_CHANNEL_ID} is not a voice channel`);
    }
    const redTeamChannel = await bot.channels.fetch(RED_TEAM_VOICE_CHANNEL_ID);
    if (redTeamChannel instanceof discord_js_1.VoiceChannel) {
        redTeamChannel.members.each(member => {
            member.voice.setChannel(startingChannel);
        });
    }
    else {
        console.error(`RED_TEAM_VOICE_CHANNEL_ID:${RED_TEAM_VOICE_CHANNEL_ID} is not a voice channel`);
    }
    startingChannel = null;
}
function makeTeams(gameName) {
    console.log('usersInGame');
    console.log(usersInGame);
    for (let i = 0; i < usersInGame.length; i++) {
        let userMmr = jsonFile.getUsersMMR(gameName, usersInGame[i]);
        if (redTeamMmr <= blueTeamMmr || (blueTeam.length >= usersInGame.length / 2)) {
            console.log('Adding user to red' + usersInGame[i]);
            redTeam.push(usersInGame[i]);
            redTeamMmr += userMmr;
        }
        else {
            console.log('Adding user to blue' + usersInGame[i]);
            blueTeam.push(usersInGame[i]);
            blueTeamMmr += userMmr;
        }
    }
}
async function makeTeamsManual(bot, gameName) {
    if (RED_TEAM_VOICE_CHANNEL_ID) {
        const channel = await bot.channels.fetch(RED_TEAM_VOICE_CHANNEL_ID);
        if (channel instanceof discord_js_1.VoiceChannel) {
            channel.members
                .each(member => {
                usersInGame.push(member.id);
                userNameMap.set(member.id, member.user.username);
                redTeam.push(member.id);
                redTeamMmr += jsonFile.getUsersMMR(gameName, member.id);
            });
            console.log(channel.members);
        }
    }
    if (BLUE_TEAM_VOICE_CHANNEL_ID) {
        const channel = await bot.channels.fetch(BLUE_TEAM_VOICE_CHANNEL_ID);
        if (channel instanceof discord_js_1.VoiceChannel) {
            channel.members
                .each(member => {
                usersInGame.push(member.id);
                userNameMap.set(member.id, member.user.username);
                blueTeam.push(member.id);
                blueTeamMmr += jsonFile.getUsersMMR(gameName, member.id);
            });
            console.log(channel.members);
        }
    }
}
function endGame(msg, updateMMR, redWon) {
    let mmrChange = null;
    if (updateMMR) {
        if (typeof redWon !== 'undefined' && GAME_NAME) {
            mmrChange = updateMmr(redWon, msg, GAME_NAME);
        }
        else {
            msg.channel.send('couldn\'t update mmr sorry!');
        }
    }
    usersInGame = [];
    GAME_NAME = null;
    redTeam = new Array();
    blueTeam = new Array();
    redTeamMmr = 0;
    blueTeamMmr = 0;
    const fileString = JSON.stringify(jsonFile.getFileToSave(), null, 2);
    fs_1.default.writeFileSync(mmrFileNme, fileString);
    let userMsg = mmrChange == null ? 'Canceled Game' : 'Game ended mmr lost/gained: ' + Math.floor(mmrChange);
    if (mmrChange != null) {
        twitchService.sendMessage(userMsg);
    }
    msg.channel.send(userMsg);
    moveUsersBack(discordLogIn_1.default);
}
let lastMap = null;
const maps = ['Bind', 'Haven', 'Split', 'Ascent'];
function pickMap(msg, supressMessage) {
    let pickMapList = maps;
    if (lastMap != null) {
        pickMapList = pickMapList.filter(map => map != lastMap);
    }
    lastMap = pickMapList[Math.floor(Math.random() * (pickMapList.length))];
    if (supressMessage == null || !supressMessage) {
        msg.channel.send(lastMap);
    }
    return lastMap;
}
function updateMmr(redWon, msg, gameName) {
    const redWinProbability = probabilityOfRedWin();
    const blueWinProbability = 1 - redWinProbability;
    let mmrChangeWeight;
    if (msg.content.includes("-close")) {
        mmrChangeWeight = MMR_CHANGE_WEIGHT * 0.5;
    }
    else if (msg.content.includes("-stomp")) {
        mmrChangeWeight = MMR_CHANGE_WEIGHT * 2;
    }
    else {
        mmrChangeWeight = MMR_CHANGE_WEIGHT;
    }
    if (redWon) {
        redTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (1 - redWinProbability)));
        blueTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (0 - blueWinProbability)));
    }
    else {
        redTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (0 - redWinProbability)));
        blueTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (1 - blueWinProbability)));
    }
    return (mmrChangeWeight * (redWon ? blueWinProbability : redWinProbability)) * 100 / RANK_GAP;
}
function updateFileMMR(file, gameName, userId, changeWeight) {
    let mmr = file.getUsersMMR(gameName, userId);
    mmr += changeWeight;
    file.addOrUpdateUser(gameName, userId, mmr);
}
function probabilityOfRedWin() {
    const ratingDifferance = blueTeamMmr - redTeamMmr;
    return 1 / (1 + (Math.pow(10, ratingDifferance / 400)));
}
//# sourceMappingURL=gameService.js.map