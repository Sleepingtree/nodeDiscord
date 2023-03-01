interface ConfigToSurrealMaping {
    selector: string;
    returnedValue: any;
};
export class BotSignInToken implements ConfigToSurrealMaping {
    public selector = "secrets:discord_bot";
    returnedValue: {
        username: string;
        password: string;
    };
}

export class TreeUserId implements ConfigToSurrealMaping {
    public selector = 'userIds:TREE_USER_ID';
    returnedValue: { value: string }
}

export type AnyConfig = TreeUserId | BotSignInToken


export default ConfigToSurrealMaping