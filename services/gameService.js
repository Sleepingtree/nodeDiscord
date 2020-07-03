const VOICE_CHANNEL_ID = process.env.GENERAL_VOICE_CHANNEL;
const TREE_USER_ID = process.env.TREE_USER_ID;
const DEFAULT_MMR = 1000;
const mmrFileNme = 'mmr.json';

const fs = require('fs');

let usersInGame = [];
let redTeam = new Array();
let blueTeam = new Array();
let userNameMap = new Map();
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
        msg.channel.send(`ゲームの中にありません`);
        return;
    }

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
    usersInGame.sort((a,b) => jsonFile[gameName][b]-jsonFile[gameName][a]);

    makeTeams();

    msg.channel.send(`Started game`);

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

    msg.channel.send(`Red team` + redTeamPrintUsers);
    msg.channel.send(`Blue team` + blueTeamPrintUsers);
}

function makeTeams(){
    console.log('usersInGame');
    console.log(usersInGame);
    let redTeamMmr = 0;
    let blueTeamMmr = 0;
    for(let i = 0; i < usersInGame.length; i++){
       let userMmr =  jsonFile[gameName][usersInGame[i]];
       console.log(usersInGame[i]);
       console.log(userMmr);
       if(redTeamMmr < blueTeamMmr && (blueTeam.length >= usersInGame.length/2)){
           redTeam.push(usersInGame[i]);
           redTeamMmr +=userMmr;
       }else{
           blueTeam.push(usersInGame[i]);
           blueTeamMmr +=userMmr;
       }
    }
}

function endGame(bot, msg) {
    usersInGame = [];
    gameName = null;
    redTeam = new Array();
    blueTeam = new Array();
    const fileString = JSON.stringify(jsonFile, null, 2);
    fs.writeFileSync(mmrFileNme, fileString);
    jsonFile = null;
    msg.channel.send(`Ended game`);
}

/*setInterval( () => console.log(redTeam), 3000);
setInterval( () => console.log(blueTeam), 3000);*/

exports.startGame = startGame;
exports.endGame = endGame;