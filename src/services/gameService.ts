const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const TREE_USER_ID = process.env.TREE_USER_ID;
const RED_TEAM_VOICE_CHANNEL_ID =process.env.RED_TEAM_VOICE_CHANNEL;
const BLUE_TEAM_VOICE_CHANNEL_ID =process.env.BLUE_TEAM_VOICE_CHANNEL;
const DEFAULT_MMR = 1000;
const MMR_CHANGE_WEIGHT = 100;
const RANK_GAP = 100;
//This defualts gold to default mmr
const BRONZE_STARTING_POINT = DEFAULT_MMR - 2 * RANK_GAP;
const mmrFileNme = 'mmr.json';

import * as twitchService from './twitchService';

import fs from 'fs';
import { Client, Message, VoiceChannel } from 'discord.js';
import bot from './discordLogIn';
import {BOT_PREFIX} from './discordLogIn';

let usersInGame: string[] = [];
let redTeam: string[] = new Array();
let blueTeam: string[] = new Array();
let userNameMap: Map<string, string> = new Map();
let gameName: string = null;
let jsonFile: Map<string, Map<string, number>> = null;
let redTeamMmr = 0;
let blueTeamMmr = 0;

bot.on('message', msg => {
    if (msg.content.startsWith(BOT_PREFIX + 'startGame')) {
        startGame(msg);
      } else if (msg.content.startsWith(BOT_PREFIX + 'gameStart')) {
        msg.channel.send("It's " + BOT_PREFIX + 'startGame ... バカ...');
      }else if (msg.content.startsWith(BOT_PREFIX + 'cancelGame')) {
        endGame(msg);
      }else if (msg.content.startsWith(BOT_PREFIX + 'redWins')) {
        endGame(msg, true);
      }else if (msg.content.startsWith(BOT_PREFIX + 'blueWins')) {
        endGame(msg, false);
      }else if (msg.content.startsWith(BOT_PREFIX + 'mmr')) {
        checkMmr(msg);
      }else if (msg.content.startsWith(BOT_PREFIX + 'map')) {
        pickMap(msg);
      }
});
  

async function startGame(msg: Message) {
    let file = fs.readFileSync(mmrFileNme, 'utf8');
    jsonFile = JSON.parse(file);

    let useMoonRunes = msg.member.id == TREE_USER_ID;

    if(gameName != null){
        msg.channel.send(`game already started call !cancelGame first or !redWins !blueWins if done`);
        return;
    }

    await bot.users
        .fetch(msg.member.id)
        .then(user => {
            useMoonRunes = false;
            for(let activityId in user.presence.activities){
                if(user.presence.activities[activityId].type === 'PLAYING'){
                    gameName = user.presence.activities[activityId].name;
                    console.log(`${jsonFile}`);
                    if(jsonFile.get(gameName) == null){
                        jsonFile.set(gameName, new Map<string, number>());
                    }
                }
            }
        });

    if(gameName == null){
        if(useMoonRunes){
            msg.channel.send('ゲームの中にありません');
        }else {
            msg.channel.send(`You are not in a game. Please make sure discord is broadcasting your game`);
        }
        return;
    }

    if(msg.content.includes("-manual")){
        await makeTeamsManual(bot);
    }else{
        console.log("in else");
        await bot.channels.fetch(VOICE_CHANNEL_ID)
            .then(channel => {
                (<VoiceChannel>channel).members
                    .each(member => {
                        usersInGame.push(member.id);
                        userNameMap.set(member.id, member.user.username)
                        if(jsonFile.get(gameName).get(member.id)== null){
                            jsonFile.get(gameName).set(member.id, DEFAULT_MMR);
                        }
                    });
                console.log((<VoiceChannel>channel).members);
            });
        //Highest mmr First
        console.log(usersInGame);
        usersInGame.sort((a,b) => jsonFile.get(gameName).get(b)-jsonFile.get(gameName).get(a));

        makeTeams();
        moveUsers(bot, redTeam);
    }

    if(usersInGame.length == 0){
        if(useMoonRunes){
            msg.channel.send(`Please join the general voice channel first, or use the -manual command while you are in the team channels`);
        }else{
            msg.channel.send(`チャンネルは誰もない`);
        }
    }else{
        const displayMessage = getTeamMessage(true, msg);
        msg.channel.send(displayMessage);
        twitchService.sendMessage(displayMessage);
    }
}

export function getTeamMessage(start?: boolean, msg?: Message){
  if(gameName == null){
    return 'No in house game started';
  }
  let gameMessage;
  if(start != null && start){
    gameMessage = `Started game of ` + gameName;
  }else{
    gameMessage = `Tree is playing a game of ` + gameName;
  }
  if(gameName == 'VALORANT' && msg != null){
      gameMessage += ' on map: ' + pickMap(msg, true);
  }
  let redTeamPrintUsers = "";
  redTeam.forEach(id => {
      console.log(id);
      if(redTeamPrintUsers != null){
          redTeamPrintUsers += ", "
      }
      redTeamPrintUsers += userNameMap.get(id) + " ";
  });

  let blueTeamPrintUsers = "";
  blueTeam.forEach(id => {
      console.log(id);
      if(blueTeamPrintUsers != null){
          blueTeamPrintUsers += ", "
      }
      blueTeamPrintUsers += userNameMap.get(id) + " ";
  });
  const displayMessage = gameMessage + '\r\n' + 'Red team' + redTeamPrintUsers + '\r\n' + 'Blue team' + blueTeamPrintUsers;
  return displayMessage;
}

async function checkMmr(msg: Message){
  const file = fs.readFileSync(mmrFileNme, 'utf8');
  const translatedFile = JSON.parse(file);
  let message = '';
  Object.keys(translatedFile).forEach(key =>{
    if(key != 'metaData'){
        if(translatedFile[key][msg.author.id] != null){
            if(message == ''){
                message = 'Your mmr ' + msg.author.username + ': ';
            }
            message += '\r\n' + key +': ' + convertUserMMRtoDisplayMMR(translatedFile[key][msg.author.id]);
            console.log(message);
        }
    }
    });
  if(message == ''){
        msg.channel.send('No MMR on file');
  }else {
    msg.channel.send(message);
  }
}

function convertUserMMRtoDisplayMMR(trueMMR: number){
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
    for(let [key, value] of mmrFloorMap){
        if(trueMMR >= value){
            lastKey = key;
            continue;
        }
        let pointsOverMin = trueMMR - mmrFloorMap.get(lastKey);
        let relativePoints = Math.floor(pointsOverMin / RANK_GAP * 100);
        if(lastKey == 'You are trying'){
          retVal = lastKey + ' with ' + relativePoints + ' out of ' + (100 * (BRONZE_STARTING_POINT/RANK_GAP)) + ' points to rank up';
        }else{
          retVal = lastKey + ' with ' + relativePoints + ' out of 100 points to rank up';
        }
        break;
    }
    if(retVal == ''){
        let pointsOverMin = trueMMR - mmrFloorMap.get(lastKey);
        let relativePoints = Math.floor(pointsOverMin / 15 * 100);
        retVal = lastKey + ' with ' + relativePoints + ' points';
    }
    return retVal;
}

async function moveUsers(bot: Client, redTeamUser: string[]){
 bot.channels.fetch(VOICE_CHANNEL_ID)
    .then(channel => {
        (<VoiceChannel>channel).members
            .each(member => {
                if(redTeamUser.filter(id => id == member.id).length >0){
                    member.voice.setChannel(RED_TEAM_VOICE_CHANNEL_ID);
                }else{
                    member.voice.setChannel(BLUE_TEAM_VOICE_CHANNEL_ID);
                }
            });
  });
}

async function moveUsersBack(bot: Client){
 bot.channels.fetch(BLUE_TEAM_VOICE_CHANNEL_ID)
    .then(channel => {
        (<VoiceChannel>channel).members
            .each(member => {
                member.voice.setChannel(VOICE_CHANNEL_ID);
            });
  });
  bot.channels.fetch(RED_TEAM_VOICE_CHANNEL_ID)
      .then(channel => {
          (<VoiceChannel>channel).members
              .each(member => {
                  member.voice.setChannel(VOICE_CHANNEL_ID);
              });
    });
}

function makeTeams(){
    console.log('usersInGame');
    console.log(usersInGame);
    for(let i = 0; i < usersInGame.length; i++){
       let userMmr =  jsonFile.get(gameName).get(usersInGame[i]);
       if(redTeamMmr <= blueTeamMmr || (blueTeam.length >= usersInGame.length/2)){
           console.log('Adding user to red' + usersInGame[i]);
           redTeam.push(usersInGame[i]);
           redTeamMmr +=userMmr;
       }else{
           console.log('Adding user to blue' + usersInGame[i]);
           blueTeam.push(usersInGame[i]);
           blueTeamMmr +=userMmr;
       }
    }
}

async function makeTeamsManual(bot: Client){
     bot.channels.fetch(RED_TEAM_VOICE_CHANNEL_ID)
        .then(channel => {
            (<VoiceChannel>channel).members
                .each(member => {
                    usersInGame.push(member.id);
                    userNameMap.set(member.id, member.user.username)
                    redTeam.push(member.id);
                    if(jsonFile.get(gameName).get(member.id) == null){
                        jsonFile.get(gameName).set(member.id, DEFAULT_MMR);
                    }
                    let userMmr =  jsonFile.get(gameName).get(member.id);
                    redTeamMmr +=userMmr;
                });
            console.log((<VoiceChannel>channel).members);
        });

    bot.channels.fetch(BLUE_TEAM_VOICE_CHANNEL_ID)
        .then(channel => {
            (<VoiceChannel>channel).members
                .each(member => {
                    usersInGame.push(member.id);
                    userNameMap.set(member.id, member.user.username)
                    blueTeam.push(member.id);
                    if(jsonFile.get(gameName).get(member.id)== null){
                        jsonFile.get(gameName).set(member.id, DEFAULT_MMR);
                    }
                    let userMmr =  jsonFile.get(gameName).get(member.id);
                    blueTeamMmr +=userMmr;
                });
            console.log((<VoiceChannel>channel).members);
        });
}

function endGame(msg: Message, redWon?: boolean) {
    let mmrChange = null;
    if(redWon != null){
       mmrChange = updateMmr(redWon, msg);
    }
    usersInGame = [];
    gameName = null;
    redTeam = new Array();
    blueTeam = new Array();
    redTeamMmr = 0;
    blueTeamMmr = 0;
    const fileString = JSON.stringify(jsonFile, null, 2);
    fs.writeFileSync(mmrFileNme, fileString);
    jsonFile = null;
    let userMsg = mmrChange == null ? 'Canceled Game' : 'Game ended mmr lost/gained: ' + Math.floor(mmrChange);
    if(mmrChange != null){
        twitchService.sendMessage(userMsg);
    }
    msg.channel.send(userMsg);
    moveUsersBack(bot);
}

let lastMap: string = null;
const maps = ['Bind', 'Haven', 'Split', 'Ascent'];

function pickMap(msg: Message, supressMessage?: boolean){
    let pickMapList = maps;
    if(lastMap != null){
        pickMapList = pickMapList.filter(map => map != lastMap);
    }
    lastMap = pickMapList[Math.floor(Math.random() * (pickMapList.length))];
    if(supressMessage == null || !supressMessage){
     msg.channel.send(lastMap);
    }
   return lastMap;
}

function updateMmr(redWon: boolean, msg: Message){
    const redWinProbability = probabilityOfRedWin();
    const blueWinProbability = 1 - redWinProbability;
    let mmrChangeWeight: number;
    if(msg.content.includes("-close")){
        mmrChangeWeight = MMR_CHANGE_WEIGHT * 0.5;
    }else if(msg.content.includes("-stomp")){
        mmrChangeWeight = MMR_CHANGE_WEIGHT * 2;
    } else{
        mmrChangeWeight = MMR_CHANGE_WEIGHT;
    }
    if(redWon){
        redTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (1 - redWinProbability)));
        blueTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (0 - blueWinProbability)));
    }else{
        redTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (0 - redWinProbability)));
        blueTeam.forEach(userId => updateFileMMR(jsonFile, gameName, userId, mmrChangeWeight * (1 - blueWinProbability)));
    }
    return (mmrChangeWeight * (redWon ? blueWinProbability : redWinProbability)) * 100/RANK_GAP;
}

function updateFileMMR(file: Map<string, Map<string, number>>, gameName:string, userId: string,changeWeight: number){
    let mmr = file.get(gameName).get(userId);
    mmr += changeWeight;
    file.get(gameName).set(userId, mmr);
}

function probabilityOfRedWin(){
    const ratingDifferance = blueTeamMmr - redTeamMmr;
    return 1/(1 +(Math.pow(10, ratingDifferance/400)));
}