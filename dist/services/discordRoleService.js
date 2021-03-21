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
Object.defineProperty(exports, "__esModule", { value: true });
const discordLogIn_1 = __importStar(require("./discordLogIn"));
const roles = ['VALORANT', 'League of Legends', 'Among Us', 'Overwatch'];
const THE_FOREST_ID = process.env.THE_FOREST_ID;
const joinCommand = discordLogIn_1.BOT_PREFIX + 'join -';
const checkUserInterval = 1000 * 60 * 5;
discordLogIn_1.default.on('message', msg => {
    if (msg.content.startsWith('!roles')) {
        listRoles(msg, joinCommand);
    }
    else if (msg.content.startsWith(joinCommand)) {
        joinRole(msg);
    }
});
function checkUsersInDisc(bot) {
    if (THE_FOREST_ID) {
        bot.guilds.fetch(THE_FOREST_ID)
            .then(server => {
            server.members.fetch()
                .then(members => {
                members.filter(member => member.presence.status !== "offline")
                    .forEach(member => checkRolesToAdd(member, server));
            });
        }).catch(console.log);
    }
    else {
        console.error('Forrest Id is not defind');
    }
}
function checkRolesToAdd(member, server) {
    for (let activity of member.presence.activities) {
        if (checkIfshouldAddRole(member, activity, server)) {
            addRolesForMember(member, activity.name, server);
        }
    }
}
function joinRole(msg) {
    const roleName = msg.content.split(" -")[1];
    if (roleName == null) {
        msg.channel.send("must be in in the form: ` !join -roleName`");
        return;
    }
    if (roles.includes(roleName) && THE_FOREST_ID) {
        discordLogIn_1.default.guilds.fetch(THE_FOREST_ID)
            .then(sever => sever.members.fetch(msg.author.id)
            .then(member => addRolesForMember(member, roleName, sever))).catch(console.log);
        msg.channel.send("Added role" + roleName);
    }
    else {
        msg.channel.send(`Can't add role ${roleName} for server ${THE_FOREST_ID}`);
    }
}
function checkIfshouldAddRole(member, activity, server) {
    const roleName = activity.name;
    const isPlaying = activity.type === 'PLAYING';
    const isRoleAddable = roles.includes(roleName);
    if (isPlaying && isRoleAddable) {
        const role = server.roles.cache.find(role => role.name === roleName);
        const isUserLackRole = role ? !(member.roles.cache.has(role.id)) : false;
        return isPlaying && isRoleAddable && isUserLackRole;
    }
    else {
        return false;
    }
}
function addRolesForMember(member, roleName, server) {
    const role = server.roles.cache.find(role => role.name === roleName);
    if (role) {
        member.roles.add(role);
        console.log('added role: ' + roleName + ' for user: ' + member.user.username);
    }
    console.log(`could not add role ${roleName} as it was not found`);
}
function listRoles(msg, joinCommand) {
    let returnMessage = 'Type one of the following to join:';
    roles.forEach(role => returnMessage += '\r\n' + joinCommand + role);
    msg.channel.send(returnMessage);
}
setInterval(() => checkUsersInDisc(discordLogIn_1.default), checkUserInterval);
//# sourceMappingURL=discordRoleService.js.map