const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const TREE_USER_ID = process.env.TREE_USER_ID;
const RED_TEAM_VOICE_CHANNEL_ID =process.env.RED_TEAM_VOICE_CHANNEL;
const BLUE_TEAM_VOICE_CHANNEL_ID =process.env.BLUE_TEAM_VOICE_CHANNEL;
const DEFAULT_MMR = 1000;
const MMR_CHANGE_WEIGHT = 30;
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

    await bot.users
        .fetch(TREE_USER_ID)
        .then(tree => {
            for(let activityId in tree.presence.activities){
                if(tree.presence.activities[activityId].type === 'PLAYING'){
                    gameName = tree.presence.activities[activityId].name;
                    console.log(jsonFile);
                    if(jsonFile[gameName] == null){
                        jsonFile[gameName] = new Object();
                    }
                }
            }
        });

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
    }

    if(usersInGame.length == 0){
        if(useMoonRunes){
            msg.channel.send(`Please join the general voice channel first, or use the -manual command while you are in the team channels`);
        }else{
            msg.channel.send(`チャンネルは誰もない`);
        }
    }else{
        msg.channel.send(`Started game of ` + gameName);
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

        msg.channel.send(`Red team` + redTeamPrintUsers + '\r\n' + `Blue team` + blueTeamPrintUsers);
    }
}

async function checkMmr(bot, msg){
    const file = fs.readFileSync(mmrFileNme, 'utf8');
    const translatedFile = JSON.parse(file);
    let message = '';
    await bot.users
        .fetch(msg.member.id)
        .then(user => {
            Object.keys(translatedFile).forEach(key =>{
                if(key != 'metaData'){
                    if(translatedFile[key][msg.member.id] != null){
                        if(message == ''){
                            message = 'Your mmr ' + msg.member.user.username + ': ';
                            console.log(message);
                        }
                        message += '\r\n' + key +': ' + translatedFile[key][msg.member.id];
                        console.log(message);
                    }
                }
            });
        });
     if(message == ''){
        msg.channel.send('No MMR on file');
     }else {
        msg.channel.send(message);
     }
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
        updateMmr(redWon);
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
}

function updateMmr(redWon){
    const redWinProbability = probabilityOfRedWin();
    const blueWinProbability = 1 - redWinProbability;
    if(redWon){
        redTeam.forEach(userId => jsonFile[gameName][userId] += MMR_CHANGE_WEIGHT * (1 - redWinProbability));
        blueTeam.forEach(userId => jsonFile[gameName][userId] += MMR_CHANGE_WEIGHT * (0 - blueWinProbability));
    }else{
        redTeam.forEach(userId => jsonFile[gameName][userId] += MMR_CHANGE_WEIGHT * (0 - redWinProbability));
        blueTeam.forEach(userId => jsonFile[gameName][userId] += MMR_CHANGE_WEIGHT * (1 - blueWinProbability));
    }
}

function probabilityOfRedWin(){
    const ratingDifferance = blueTeamMmr - redTeamMmr;
    return 1/(1 +(Math.pow(10, ratingDifferance/400)));
}

/*setInterval( () => console.log(redTeam), 3000);
setInterval( () => console.log(blueTeam), 3000);*/

exports.startGame = startGame;
exports.endGame = endGame;
exports.checkMmr = checkMmr;