interface ConfigToSurrealMaping {
    selector: string;
    returnedValue: any;
}

export class BotSignInToken implements ConfigToSurrealMaping {
    selector = "secrets:discord_bot";
    returnedValue = {
        username: "string",
        password: "string"
    };
}

export class TreeUserId implements ConfigToSurrealMaping {
    selector = 'userIds:TREE_USER_ID';
    returnedValue = { value: "string" }
}

export class WhissUserId implements ConfigToSurrealMaping {
    selector = 'userIds:WHISS_USER_ID';
    returnedValue = { value: "string" }
}

export class TwitchBot implements ConfigToSurrealMaping {
    selector = "secrets:twitch";
    returnedValue = {
        channel: "string",
        id: "secrets:twitch",
        password: "string",
        username: "string"
    }
}

export class Wanikani implements ConfigToSurrealMaping {
    selector = "secrets:wanikani";
    returnedValue = {
        apiKey: "string",
    }
}

export class NotifyMe implements ConfigToSurrealMaping {
    selector = "secrets:notifyMe";
    returnedValue = {
        apiKey: "string",
    }
}

export class GoogleAPIKey implements ConfigToSurrealMaping {
    selector = "secrets:google";
    returnedValue = {
        apiKey: "string",
    }
}


export class GeneralVoiceChannel implements ConfigToSurrealMaping {
    selector = "discord_channels:GENERAL_VOICE_CHANNEL";
    returnedValue = {
        value: "string",
    }
}

export class BlueVoiceChannel implements ConfigToSurrealMaping {
    selector = "discord_channels:BLUE_TEAM_VOICE_CHANNEL";
    returnedValue = {
        value: "string",
    }
}

export class ClashPlaningTextChannel implements ConfigToSurrealMaping {
    selector = "discord_channels:CLASH_PLANING_TEXT_CHANNEL";
    returnedValue = {
        value: "string",
    }
}

export class GeneralTextChannel implements ConfigToSurrealMaping {
    selector = "discord_channels:GENERAL_TEXT_CHANNEL";
    returnedValue = {
        value: "string",
    }
}

export class RedTeamVoiceChannel implements ConfigToSurrealMaping {
    selector = "discord_channels:RED_TEAM_VOICE_CHANNEL";
    returnedValue = {
        value: "string",
    }
}

export class TheForest implements ConfigToSurrealMaping {
    selector = "servers:THE_FOREST_ID";
    returnedValue = {
        value: "string",
    }
}

export default ConfigToSurrealMaping