import * as twitchService from './twitchService';

import fs from 'fs';
import { Client, Message, VoiceChannel } from 'discord.js';
import bot, { BOT_PREFIX } from './discordLogIn';
import MMRFile from '../model/mmrFile';
import { BlueVoiceChannel, RedTeamVoiceChannel, TreeUserId } from '../model/runtimeConfig';
import { getRuntimeConfig } from './dbServiceAdapter';


const MMR_CHANGE_WEIGHT = 100;
const RANK_GAP = 100;
//This defualts gold to default mmr
const BRONZE_STARTING_POINT = MMRFile.DEFAULT_MMR - 2 * RANK_GAP;
const mmrFileNme = 'mmr.json';

let usersInGame: string[] = [];
let redTeam: string[] = new Array();
let blueTeam: string[] = new Array();
let userNameMap: Map<string, string> = new Map();
let GAME_NAME: string | null;
let jsonFile: MMRFile;
let redTeamMmr = 0;
let blueTeamMmr = 0;
let startingChannel: VoiceChannel | null;

bot.on('messageCreate', msg => {
    if (msg.content.startsWith(BOT_PREFIX + 'startGame')) {
        startGame(msg);
    } else if (msg.content.startsWith(BOT_PREFIX + 'gameStart')) {
        msg.channel.send("It's " + BOT_PREFIX + 'startGame ... バカ...');
    } else if (msg.content.startsWith(BOT_PREFIX + 'cancelGame')) {
        endGame(msg, false);
    } else if (msg.content.startsWith(BOT_PREFIX + 'redWins')) {
        endGame(msg, true, true);
    } else if (msg.content.startsWith(BOT_PREFIX + 'blueWins')) {
        endGame(msg, true, false);
    } else if (msg.content.startsWith(BOT_PREFIX + 'mmr')) {
        checkMmr(msg);
    } else if (msg.content.startsWith(BOT_PREFIX + 'map')) {
        pickMap(msg);
    }
});

async function startGame(msg: Message) {
    if (msg.member) {
        const voiceChannel = msg.member.voice.channel;
        if (!voiceChannel || voiceChannel?.type === "GUILD_STAGE_VOICE") {
            msg.channel.send(`Must be in a voice channel to start a game`);
            return;
        } else {
            startingChannel = voiceChannel;
        }
        try {
            const file = fs.readFileSync(mmrFileNme, 'utf8');
            jsonFile = new MMRFile(file);
        } catch {
            console.warn(`mmrFile in path ${mmrFileNme} does not exist making new file`);
            jsonFile = new MMRFile();
        }
        const { value: treeUserId } = await getRuntimeConfig(TreeUserId)

        const useMoonRunes = msg.member.id === treeUserId;

        if (GAME_NAME != null) {
            msg.channel.send(`game already started call !cancelGame first or !redWins !blueWins if done`);
            return;
        }

        const userGameName = msg.member.presence?.activities.find(activity => activity.type === 'PLAYING')?.name;

        if (userGameName) {
            GAME_NAME = userGameName;
            console.log(`${jsonFile}`);

            if (msg.content.includes("-manual")) {
                await makeTeamsManual(bot, userGameName);
            } else {
                console.log("in else");
                if (voiceChannel && GAME_NAME && jsonFile) {
                    voiceChannel.members
                        .each(member => {
                            usersInGame.push(member.id);
                            userNameMap.set(member.id, member.user.username)
                        });
                    console.log(voiceChannel.members);
                    //Highest mmr First
                    console.log(usersInGame);
                    usersInGame.sort((a, b) => userCompairator(a, b, userGameName));

                    makeTeams(userGameName);
                    moveUsers(redTeam, voiceChannel);
                }
            }
        } else {
            if (useMoonRunes) {
                msg.channel.send('ゲームの中にありません');
            } else {
                msg.channel.send(`You are not in a game. Please make sure discord is broadcasting your game`);
            }
            return;
        }

        if (usersInGame.length == 0) {
            if (useMoonRunes) {
                msg.channel.send(`Please join the general voice channel first, or use the -manual command while you are in the team channels`);
            } else {
                msg.channel.send(`チャンネルは誰もない`);
            }
        } else {
            const displayMessage = getTeamMessage(true, msg);
            msg.channel.send(displayMessage);
            twitchService.sendMessage(displayMessage);
        }
    }
}

function userCompairator(a: string, b: string, userGameName: string): number {
    let bUser = jsonFile.getUsersMMR(userGameName, b)
    let aUser = jsonFile.getUsersMMR(userGameName, a);
    return bUser - aUser;
}

export function getTeamMessage(start?: boolean, msg?: Message) {
    if (GAME_NAME == null) {
        return 'No in house game started';
    }
    let gameMessage;
    if (start != null && start) {
        gameMessage = `Started game of ` + GAME_NAME;
    } else {
        gameMessage = `Tree is playing a game of ` + GAME_NAME;
    }
    if (GAME_NAME == 'VALORANT' && msg != null) {
        gameMessage += ' on map: ' + pickMap(msg, true);
    }
    let redTeamPrintUsers = "";
    redTeam.forEach(id => {
        console.log(id);
        if (redTeamPrintUsers != null) {
            redTeamPrintUsers += ", "
        }
        redTeamPrintUsers += userNameMap.get(id) + " ";
    });

    let blueTeamPrintUsers = "";
    blueTeam.forEach(id => {
        console.log(id);
        if (blueTeamPrintUsers != null) {
            blueTeamPrintUsers += ", "
        }
        blueTeamPrintUsers += userNameMap.get(id) + " ";
    });
    const displayMessage = gameMessage + '\r\n' + 'Red team' + redTeamPrintUsers + '\r\n' + 'Blue team' + blueTeamPrintUsers;
    return displayMessage;
}

async function checkMmr(msg: Message) {
    const file = fs.readFileSync(mmrFileNme, 'utf8');
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
    } else {
        msg.channel.send(message);
    }
}

function convertUserMMRtoDisplayMMR(trueMMR: number) {
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
        } else {
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

async function moveUsers(redTeamUser: string[], channel: VoiceChannel) {
    const { value: redTeamVoiceChannelId } = await getRuntimeConfig(RedTeamVoiceChannel)
    if (!redTeamVoiceChannelId) {
        console.log("RED_TEAM_VOICE_CHANNEL_ID not defined!")
        return;
    }
    const { value: blueTeamVoiceChannelId } = await getRuntimeConfig(BlueVoiceChannel)
    if (!blueTeamVoiceChannelId) {
        console.log("BLUE_TEAM_VOICE_CHANNEL_ID not defined!")
        return;
    }
    channel.members
        .each(member => {
            if (redTeamUser.filter(id => id == member.id).length > 0) {
                member.voice.setChannel(redTeamVoiceChannelId);
            } else {
                member.voice.setChannel(blueTeamVoiceChannelId);
            }
        });
}

async function moveUsersBack(bot: Client) {
    const { value: redTeamVoiceChannelId } = await getRuntimeConfig(RedTeamVoiceChannel)
    if (!redTeamVoiceChannelId) {
        console.log("RED_TEAM_VOICE_CHANNEL_ID not defined!")
        return;
    }
    const { value: blueTeamVoiceChannelId } = await getRuntimeConfig(BlueVoiceChannel)
    if (!blueTeamVoiceChannelId) {
        console.log("BLUE_TEAM_VOICE_CHANNEL_ID not defined!")
        return;
    }

    const blueTeamChannel = await bot.channels.fetch(blueTeamVoiceChannelId);
    if (blueTeamChannel instanceof VoiceChannel) {
        blueTeamChannel.members.each(member => {
            member.voice.setChannel(startingChannel);
        });
    } else {
        console.error(`BLUE_TEAM_VOICE_CHANNEL_ID:${blueTeamVoiceChannelId} is not a voice channel`);
    }

    const redTeamChannel = await bot.channels.fetch(redTeamVoiceChannelId);
    if (redTeamChannel instanceof VoiceChannel) {
        redTeamChannel.members.each(member => {
            member.voice.setChannel(startingChannel);
        });
    } else {
        console.error(`RED_TEAM_VOICE_CHANNEL_ID:${redTeamVoiceChannelId} is not a voice channel`);
    }

    startingChannel = null;
}

function makeTeams(gameName: string) {
    console.log('usersInGame');
    console.log(usersInGame);

    for (let i = 0; i < usersInGame.length; i++) {
        let userMmr = jsonFile.getUsersMMR(gameName, usersInGame[i]);
        if (redTeamMmr <= blueTeamMmr || (blueTeam.length >= usersInGame.length / 2)) {
            console.log('Adding user to red' + usersInGame[i]);
            redTeam.push(usersInGame[i]);
            redTeamMmr += userMmr;
        } else {
            console.log('Adding user to blue' + usersInGame[i]);
            blueTeam.push(usersInGame[i]);
            blueTeamMmr += userMmr;
        }
    }
}

async function makeTeamsManual(bot: Client, gameName: string) {
    const { value: redTeamVoiceChannelId } = await getRuntimeConfig(RedTeamVoiceChannel)
    if (redTeamVoiceChannelId) {
        const channel = await bot.channels.fetch(redTeamVoiceChannelId);
        if (channel instanceof VoiceChannel) {
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

    const { value: blueTeamVoiceChannelId } = await getRuntimeConfig(BlueVoiceChannel)
    if (blueTeamVoiceChannelId) {
        const channel = await bot.channels.fetch(blueTeamVoiceChannelId);
        if (channel instanceof VoiceChannel) {
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

function endGame(msg: Message, updateMMR: boolean, redWon?: boolean) {
    let mmrChange = null;
    if (updateMMR) {
        if (typeof redWon !== 'undefined' && GAME_NAME) {
            mmrChange = updateMmr(redWon, msg, GAME_NAME);
        } else {
            msg.channel.send('couldn\'t update mmr sorry!')
        }

    }
    usersInGame = [];
    GAME_NAME = null;
    redTeam = new Array();
    blueTeam = new Array();
    redTeamMmr = 0;
    blueTeamMmr = 0;
    const fileString = JSON.stringify(jsonFile.getFileToSave(), null, 2);
    fs.writeFileSync(mmrFileNme, fileString);
    let userMsg = mmrChange == null ? 'Canceled Game' : 'Game ended mmr lost/gained: ' + Math.floor(mmrChange);
    if (mmrChange != null) {
        twitchService.sendMessage(userMsg);
    }
    msg.channel.send(userMsg);
    moveUsersBack(bot);
}

let lastMap: string | null = null;
const maps = ['Bind', 'Haven', 'Split', 'Ascent'];

function pickMap(msg: Message, supressMessage?: boolean) {
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

function updateMmr(redWon: boolean, msg: Message, gameName: string) {
    const redWinProbability = probabilityOfRedWin();
    const blueWinProbability = 1 - redWinProbability;
    let mmrChangeWeight: number;
    if (msg.content.includes("-close")) {
        mmrChangeWeight = MMR_CHANGE_WEIGHT * 0.5;
    } else if (msg.content.includes("-stomp")) {
        mmrChangeWeight = MMR_CHANGE_WEIGHT * 2;
    } else {
        mmrChangeWeight = MMR_CHANGE_WEIGHT;
    }
    if (redWon) {
        redTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (1 - redWinProbability)));
        blueTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (0 - blueWinProbability)));
    } else {
        redTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (0 - redWinProbability)));
        blueTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (1 - blueWinProbability)));
    }
    return (mmrChangeWeight * (redWon ? blueWinProbability : redWinProbability)) * 100 / RANK_GAP;
}

function updateFileMMR(file: MMRFile, gameName: string, userId: string, changeWeight: number) {
    let mmr = file.getUsersMMR(gameName, userId);
    mmr += changeWeight;
    file.addOrUpdateUser(gameName, userId, mmr);
}

function probabilityOfRedWin() {
    const ratingDifferance = blueTeamMmr - redTeamMmr;
    return 1 / (1 + (Math.pow(10, ratingDifferance / 400)));
}