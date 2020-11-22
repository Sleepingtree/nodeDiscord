const roles = ['VALORANT', 'League of Legends', 'Among Us', 'Overwatch'];
const THE_FOREST_ID = process.env.THE_FOREST_ID;

function checkUsersInDisc(bot){
    bot.guilds.fetch(THE_FOREST_ID)
        .then(server =>{
            server.members.fetch()
                .then(members =>{
                    members.filter(member => member.presence.status !== "offline")
                    .forEach(member => checkRolesToAdd(member, server));
                })
        }).catch(console.log);
}

function checkRolesToAdd(member, server){
    for(let activityId in member.presence.activities){
        if(checkIfshouldAddRole(member, activityId, server)){
            addRolesForMember(member, member.presence.activities[activityId].name, server);
        }
    }
}

function joinRole(bot, msg){
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

function checkIfshouldAddRole(member, activityId, server){
    const roleName = member.presence.activities[activityId].name;
    const isPlaying = member.presence.activities[activityId].type === 'PLAYING';
    const isRoleAddable = roles.includes(member.presence.activities[activityId].name);
    if(isPlaying && isRoleAddable){
      const role = server.roles.cache.find(role => role.name === roleName);
      const isUserLackRole = !(member.roles.cache.has(role.id));
      return isPlaying && isRoleAddable && isUserLackRole;
    }else{
        return false;
    }
}

function addRolesForMember(member, roleName, server){
    const role = server.roles.cache.find(role => role.name === roleName);
    member.roles.add(role);
    console.log('added role: ' + roleName + ' for user: ' + member.user.username);
}

function listRoles(bot, msg, joinCommand){
    let returnMessage = 'Type one of the following to join:'
    roles.forEach(role => returnMessage += '\r\n' + joinCommand + role);
    msg.channel.send(returnMessage);
}

exports.checkUsersInDisc = checkUsersInDisc;
exports.joinRole = joinRole;
exports.listRoles = listRoles;