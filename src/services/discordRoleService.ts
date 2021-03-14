import { Activity, Client, Guild, GuildMember, Message } from "discord.js";
import bot from './discordLogIn';
import {BOT_PREFIX} from './discordLogIn';

const roles = ['VALORANT', 'League of Legends', 'Among Us', 'Overwatch'];
const THE_FOREST_ID = process.env.THE_FOREST_ID;
const joinCommand = BOT_PREFIX + 'join -';
const checkUserInterval = 1000 * 60 * 5;

bot.on('message', msg => {
    if(msg.content.startsWith('!roles')){
        listRoles(msg, joinCommand);
    } else if (msg.content.startsWith(joinCommand)) {
        joinRole(msg);
    }
});

function checkUsersInDisc(bot: Client){
    bot.guilds.fetch(THE_FOREST_ID)
        .then(server =>{
            server.members.fetch()
                .then(members =>{
                    members.filter(member => member.presence.status !== "offline")
                    .forEach(member => checkRolesToAdd(member, server));
                })
        }).catch(console.log);
}

function checkRolesToAdd(member: GuildMember, server: Guild){
    for(let activity of member.presence.activities){
        if(checkIfshouldAddRole(member, activity, server)){
            addRolesForMember(member, activity.name, server);
        }
    }
}

function joinRole(msg: Message){
    const roleName = msg.content.split(" -")[1];
    if(roleName == null){
     msg.channel.send("must be in in the form: ` !join -roleName`");
     return;
    }
    if(roles.includes(roleName)){
        bot.guilds.fetch(THE_FOREST_ID)
                .then(sever =>
                    sever.members.fetch(msg.author.id)
                        .then(member =>
                            addRolesForMember(member, roleName, sever))
                ).catch(console.log);
        msg.channel.send("Added role" + roleName);
    }else{
        msg.channel.send("Can't add role " + roleName);
    }
}

function checkIfshouldAddRole(member: GuildMember, activity: Activity, server: Guild){
    const roleName = activity.name;
    const isPlaying = activity.type === 'PLAYING';
    const isRoleAddable = roles.includes(roleName);
    if(isPlaying && isRoleAddable){
      const role = server.roles.cache.find(role => role.name === roleName);
      const isUserLackRole = !(member.roles.cache.has(role.id));
      return isPlaying && isRoleAddable && isUserLackRole;
    }else{
        return false;
    }
}

function addRolesForMember(member: GuildMember, roleName: String, server: Guild){
    const role = server.roles.cache.find(role => role.name === roleName);
    member.roles.add(role);
    console.log('added role: ' + roleName + ' for user: ' + member.user.username);
}

function listRoles(msg: Message, joinCommand: String){
    let returnMessage = 'Type one of the following to join:'
    roles.forEach(role => returnMessage += '\r\n' + joinCommand + role);
    msg.channel.send(returnMessage);
}

setInterval(() => checkUsersInDisc(bot), checkUserInterval);