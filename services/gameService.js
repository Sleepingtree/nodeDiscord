const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const TREE_USER_ID = process.env.TREE_USER_ID;
const RED_TEAM_VOICE_CHANNEL_ID =process.env.RED_TEAM_VOICE_CHANNEL;
const BLUE_TEAM_VOICE_CHANNEL_ID =process.env.BLUE_TEAM_VOICE_CHANNEL;
const DEFAULT_MMR = 1000;
const MMR_CHANGE_WEIGHT = 100;
const mmrFileNme = 'mmr.json';

const fs = require('fs');

let usersInGame = [];
let redTeam = new Array();
let blueTeam = new Array();
let userNameMap = new Map();
let gameName;
let jsonFile;
let redTeamMmr = 0;
let blueTeamMmr = 0;

async function startGame(bot, msg) {
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
                    console.log(jsonFile);
                    if(jsonFile[gameName] == null){
                        jsonFile[gameName] = new Object();
                    }
                }
            }
        });

    if(gameName == null){
        if(useMoonRunes){
            msg.channel.send(`ゲームの中にありません`);
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
                channel.members
                    .each(member => {
                        usersInGame.push(member.id);
                        userNameMap.set(member.id, member.user.username)
                        if(jsonFile[gameName][member.id] == null){
                            jsonFile[gameName][member.id] = DEFAULT_MMR;
                        }
                    });
                console.log(channel.members);
            });
        //Highest mmr First
        console.log(usersInGame);
        usersInGame.sort((a,b) => jsonFile[gameName][b]-jsonFile[gameName][a]);

        makeTeams();
        moveUsers(bot, redTeam, blueTeam);
    }

    if(usersInGame.length == 0){
        if(useMoonRunes){
            msg.channel.send(`Please join the general voice channel first, or use the -manual command while you are in the team channels`);
        }else{
            msg.channel.send(`チャンネルは誰もない`);
        }
    }else{
        let gameMessage = `Started game of ` + gameName;
        if(gameName = 'VALORANT'){
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

        msg.channel.send(gameMessage + '\r\n' + 'Red team' + redTeamPrintUsers + '\r\n' + 'Blue team' + blueTeamPrintUsers);
    }
}

async function checkMmr(bot, msg){
  const file = fs.readFileSync(mmrFileNme, 'utf8');
  const translatedFile = JSON.parse(file);
  let message = '';
  Object.keys(translatedFile).forEach(key =>{
    if(key != 'metaData'){
        if(translatedFile[key][msg.member.id] != null){
            if(message == ''){
                message = 'Your mmr ' + msg.member.user.username + ': ';
                console.log(message);
            }
            message += '\r\n' + key +': ' + convertUserMMRtoDisplayMMR(translatedFile[key][msg.member.id]);
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

function convertUserMMRtoDisplayMMR(trueMMR){
    let mmrFloorMap = new Map();
    let retVal = '';
    //make list of names then add points
    const rankNames = ['Bronze', 'Silver', 'Gold', 'Plat', 'Diamond', 'Masters'];
    const rankGap = 25;
    const bronzeStartingPoint = 950;
    let rankfloor = bronzeStartingPoint;
    mmrFloorMap.set('You are trying', 0);
    rankNames.forEach(name => {
        mmrFloorMap.set(name, rankfloor);
        rankfloor += rankGap;
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
        let relativePoints = Math.floor(pointsOverMin / rankGap * 100);
        if(lastKey == 'You are trying'){
          retVal = lastKey + ' with ' + relativePoints + ' out of ' + (100 * (bronzeStartingPoint/rankGap)) + ' points to rank up';
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

async function moveUsers(bot, redTeamUser, blueteamUsers){
 bot.channels.fetch(VOICE_CHANNEL_ID)
    .then(channel => {
        channel.members
            .each(member => {
                if(redTeamUser.filter(id => id == member.id).length >0){
                    member.voice.setChannel(RED_TEAM_VOICE_CHANNEL_ID);
                }else{
                    member.voice.setChannel(BLUE_TEAM_VOICE_CHANNEL_ID);
                }
            });
  });
}

async function moveUsersBack(bot){
 bot.channels.fetch(BLUE_TEAM_VOICE_CHANNEL_ID)
    .then(channel => {
        channel.members
            .each(member => {
                member.voice.setChannel(VOICE_CHANNEL_ID);
            });
  });
  bot.channels.fetch(RED_TEAM_VOICE_CHANNEL_ID)
      .then(channel => {
          channel.members
              .each(member => {
                  member.voice.setChannel(VOICE_CHANNEL_ID);
              });
    });
}

function makeTeams(){
    console.log('usersInGame');
    console.log(usersInGame);
    for(let i = 0; i < usersInGame.length; i++){
       let userMmr =  jsonFile[gameName][usersInGame[i]];
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

async function makeTeamsManual(bot){
     bot.channels.fetch(RED_TEAM_VOICE_CHANNEL_ID)
        .then(channel => {
            channel.members
                .each(member => {
                    usersInGame.push(member.id);
                    userNameMap.set(member.id, member.user.username)
                    redTeam.push(member.id);
                    if(jsonFile[gameName][member.id] == null){
                        jsonFile[gameName][member.id] = DEFAULT_MMR;
                    }
                    let userMmr =  jsonFile[gameName][member.id];
                    redTeamMmr +=userMmr;
                });
            console.log(channel.members);
        });

    bot.channels.fetch(BLUE_TEAM_VOICE_CHANNEL_ID)
        .then(channel => {
            channel.members
                .each(member => {
                    usersInGame.push(member.id);
                    userNameMap.set(member.id, member.user.username)
                    blueTeam.push(member.id);
                    if(jsonFile[gameName][member.id] == null){
                        jsonFile[gameName][member.id] = DEFAULT_MMR;
                    }
                    let userMmr =  jsonFile[gameName][member.id];
                    blueTeamMmr +=userMmr;
                });
            console.log(channel.members);
        });
}

function endGame(bot, msg, redWon) {
    if(redWon != null){
        updateMmr(redWon, msg);
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
    msg.channel.send(`Ended game`);
    moveUsersBack(bot);
}

let lastMap = null;
const maps = ['Bind', 'Haven', 'Split', 'Ascent'];

function pickMap(msg, supressMessage){
    let pickMapList = maps;
    if(lastMap != null){
        pickMapList = pickMapList.filter(map => map != lastMap);
    }
    lastMap = maps[Math.floor(Math.random() * (pickMapList.length + 1))];
    if(supressMessage == null || !supressMessage){
     msg.channel.send(lastMap);
    }
   return lastMap;
}

function updateMmr(redWon, msg){
    const redWinProbability = probabilityOfRedWin();
    const blueWinProbability = 1 - redWinProbability;
    let mmrChangeWeight;
    if(msg.content.includes("-close")){
        mmrChangeWeight = MMR_CHANGE_WEIGHT * 0.5;
    }else if(msg.content.includes("-stomp)){
        mmrChangeWeight = MMR_CHANGE_WEIGHT * 2;
    } else{
        mmrChangeWeight = MMR_CHANGE_WEIGHT;
    }
    if(redWon){
        redTeam.forEach(userId => jsonFile[gameName][userId] += mmrChangeWeight * (1 - redWinProbability));
        blueTeam.forEach(userId => jsonFile[gameName][userId] += mmrChangeWeight * (0 - blueWinProbability));
    }else{
        redTeam.forEach(userId => jsonFile[gameName][userId] += mmrChangeWeight * (0 - redWinProbability));
        blueTeam.forEach(userId => jsonFile[gameName][userId] += mmrChangeWeight * (1 - blueWinProbability));
    }
}

function probabilityOfRedWin(){
    const ratingDifferance = blueTeamMmr - redTeamMmr;
    return 1/(1 +(Math.pow(10, ratingDifferance/100)));
}

/*setInterval( () => console.log(redTeam), 3000);
setInterval( () => console.log(blueTeam), 3000);*/

exports.startGame = startGame;
exports.endGame = endGame;
exports.checkMmr = checkMmr;
exports.pickMap = pickMap;