"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRoles = exports.joinRole = exports.checkUsersInDisc = void 0;
const roles = ['VALORANT', 'League of Legends', 'Among Us', 'Overwatch'];
const THE_FOREST_ID = process.env.THE_FOREST_ID;
function checkUsersInDisc(bot) {
    bot.guilds.fetch(THE_FOREST_ID)
        .then(server => {
        server.members.fetch()
            .then(members => {
            members.filter(member => member.presence.status !== "offline")
                .forEach(member => checkRolesToAdd(member, server));
        });
    }).catch(console.log);
}
exports.checkUsersInDisc = checkUsersInDisc;
function checkRolesToAdd(member, server) {
    for (let activity of member.presence.activities) {
        if (checkIfshouldAddRole(member, activity, server)) {
            addRolesForMember(member, activity.name, server);
        }
    }
}
function joinRole(bot, msg) {
    const roleName = msg.content.split(" -")[1];
    if (roleName == null) {
        msg.channel.send("must be in in the form: ` !join -roleName`");
        return;
    }
    if (roles.includes(roleName)) {
        bot.guilds.fetch(THE_FOREST_ID)
            .then(sever => sever.members.fetch(msg.author.id)
            .then(member => addRolesForMember(member, roleName, sever))).catch(console.log);
        msg.channel.send("Added role" + roleName);
    }
    else {
        msg.channel.send("Can't add role " + roleName);
    }
}
exports.joinRole = joinRole;
function checkIfshouldAddRole(member, activity, server) {
    const roleName = activity.name;
    const isPlaying = activity.type === 'PLAYING';
    const isRoleAddable = roles.includes(roleName);
    if (isPlaying && isRoleAddable) {
        const role = server.roles.cache.find(role => role.name === roleName);
        const isUserLackRole = !(member.roles.cache.has(role.id));
        return isPlaying && isRoleAddable && isUserLackRole;
    }
    else {
        return false;
    }
}
function addRolesForMember(member, roleName, server) {
    const role = server.roles.cache.find(role => role.name === roleName);
    member.roles.add(role);
    console.log('added role: ' + roleName + ' for user: ' + member.user.username);
}
function listRoles(bot, msg, joinCommand) {
    let returnMessage = 'Type one of the following to join:';
    roles.forEach(role => returnMessage += '\r\n' + joinCommand + role);
    msg.channel.send(returnMessage);
}
exports.listRoles = listRoles;
//# sourceMappingURL=discordRoleService.js.map