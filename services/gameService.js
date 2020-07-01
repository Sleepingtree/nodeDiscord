const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const TREE_USER_ID = process.env.TREE_USER_ID;
const DEFAULT_MMR = 1000;
const mmrFileNme = 'mmr.json';

var fs = require('fs');

//Map<String,Map<String,long>> or  map<gameName,map<userId,mmr>>
let usersInGame = [];
let gameName;
let jsonFile;

async function startGame(bot, msg) {
    let file = fs.readFileSync(mmrFileNme, 'utf8');
    jsonFile = JSON.parse(file);

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

    if(gameName == null){
        msg.channel.send(`game did not start`);
        return;
    }

    await bot.channels.fetch(VOICE_CHANNEL_ID)
        .then(channel => {
            channel.members
                .each(member => {
                    usersInGame.push(member);
                    console.log('jsonFile');
                    console.log(jsonFile);
                    if(jsonFile[gameName][member.id] == null){
                        jsonFile[gameName][member.id] = DEFAULT_MMR;
                    }
                });
            console.log(channel.members);
        });
    //Highest mmr First
    usersInGame.sort((a,b) => b-a);
    //call make teams
    msg.channel.send(`Started game`);
}

function makeTeams(){
    let sum;
    const eachTeamMmrSum = sum/2;
    let usersInGameCopy = usersInGame;
    let redTeamMmr = 0;
    let redTeam = [];

    let blueTeam = [];
    for(let i = 0; i < usersInGame; i++){
       let userMmr =  jsonFile[gameName][usersInGame[i]];
       if(redTeamMmr + userMmr > eachTeamMmrSum){
           blueTeam.push(usersInGame[i]);
       }

    }
}

function endGame(bot, msg) {
    usersInGame = [];
    gameName = null;
    const fileString = JSON.stringify(jsonFile, null, 2);
    fs.writeFileSync(mmrFileNme, fileString);
    jsonFile = null;
    msg.channel.send(`Ended game`);
}

setInterval( () => console.log(jsonFile), 3000);

exports.startGame = startGame;
exports.endGame = endGame;