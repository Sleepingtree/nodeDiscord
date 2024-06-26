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
const roles = process.env.DISCORD_BOT_ROLES ? process.env.DISCORD_BOT_ROLES.split('|') : [];
const THE_FOREST_ID = process.env.THE_FOREST_ID;
const joinCommand = `${discordLogIn_1.BOT_PREFIX}join -`;
discordLogIn_1.default.on('message', msg => {
    if (msg.content.startsWith('!roles')) {
        listRoles(msg, joinCommand);
    }
    else if (msg.content.startsWith(joinCommand)) {
        joinRole(msg);
    }
});
discordLogIn_1.default.on('presenceUpdate', (_oldPresence, presence) => {
    var _a;
    if (((_a = presence.guild) === null || _a === void 0 ? void 0 : _a.id) === THE_FOREST_ID) {
        presence.activities
            .filter(activity => {
            return roles.includes(activity.name) && activity.type === 'PLAYING';
        }).map(activity => { var _a; return (_a = presence.guild) === null || _a === void 0 ? void 0 : _a.roles.cache.find(role => role.name === activity.name); })
            .filter(roleNotEmpty)
            .filter(role => { var _a; return !((_a = presence.member) === null || _a === void 0 ? void 0 : _a.roles.cache.has(role.id)); })
            .forEach(role => {
            var _a, _b;
            console.log(`added role ${role.name} to user ${(_a = presence.member) === null || _a === void 0 ? void 0 : _a.user.username}`);
            (_b = presence.member) === null || _b === void 0 ? void 0 : _b.roles.add(role);
        });
    }
});
function roleNotEmpty(value) {
    return !(value === null || value === undefined);
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
function addRolesForMember(member, roleName, server) {
    const role = server.roles.cache.find(role => role.name === roleName);
    if (role) {
        member.roles.add(role);
        console.log('added role: ' + roleName + ' for user: ' + member.user.username);
    }
    else {
        console.log(`could not add role ${roleName} as it was not found`);
    }
}
function listRoles(msg, joinCommand) {
    let returnMessage = 'Type one of the following to join:';
    roles.forEach(role => returnMessage += '\r\n' + joinCommand + role);
    msg.channel.send(returnMessage);
}
//# sourceMappingURL=discordRoleService.js.map