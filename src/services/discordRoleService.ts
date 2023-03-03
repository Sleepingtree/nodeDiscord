import { Guild, GuildMember, Message } from "discord.js";
import { TheForest } from "../model/runtimeConfig";
import { getRuntimeConfig } from "./dbServiceAdapter";
import bot, { BOT_PREFIX } from './discordLogIn';

const roles = process.env.DISCORD_BOT_ROLES ? process.env.DISCORD_BOT_ROLES.split('|') : [];
const joinCommand = `${BOT_PREFIX}join -`;

bot.on('messageCreate', msg => {
    if (msg.content.startsWith('!roles')) {
        listRoles(msg, joinCommand);
    } else if (msg.content.startsWith(joinCommand)) {
        joinRole(msg);
    }
});

bot.on('presenceUpdate', async (_oldPresence, presence) => {
    const { value: theForestId } = await getRuntimeConfig(TheForest)
    if (presence.guild?.id === theForestId) {
        presence.activities
            .filter(activity => {
                return roles.includes(activity.name) && activity.type === 'PLAYING';
            }).map(activity => presence.guild?.roles.cache.find(role => role.name === activity.name))
            .filter(roleNotEmpty)
            .filter(role => !presence.member?.roles.cache.has(role.id))
            .forEach(role => {
                console.log(`added role ${role.name} to user ${presence.member?.user.username}`)
                presence.member?.roles.add(role);
            });
    }
});

function roleNotEmpty<Role>(value: Role | null | undefined): value is Role {
    return !(value === null || value === undefined);
}

async function joinRole(msg: Message) {
    const { value: theForestId } = await getRuntimeConfig(TheForest)
    const roleName = msg.content.split(" -")[1];
    if (roleName == null) {
        msg.channel.send("must be in in the form: ` !join -roleName`");
        return;
    }
    if (roles.includes(roleName) && theForestId) {
        bot.guilds.fetch(theForestId)
            .then(sever =>
                sever.members.fetch(msg.author.id)
                    .then(member =>
                        addRolesForMember(member, roleName, sever))
            ).catch(console.log);
        msg.channel.send("Added role" + roleName);
    } else {
        msg.channel.send(`Can't add role ${roleName} for server ${theForestId}`);
    }
}

function addRolesForMember(member: GuildMember, roleName: String, server: Guild) {
    const role = server.roles.cache.find(role => role.name === roleName);
    if (role) {
        member.roles.add(role);
        console.log('added role: ' + roleName + ' for user: ' + member.user.username);
    } else {
        console.log(`could not add role ${roleName} as it was not found`);
    }
}

function listRoles(msg: Message, joinCommand: String) {
    let returnMessage = 'Type one of the following to join:'
    roles.forEach(role => returnMessage += '\r\n' + joinCommand + role);
    msg.channel.send(returnMessage);
}