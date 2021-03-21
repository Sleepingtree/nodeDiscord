export default class MMRFile {
    static DEFAULT_MMR: number;
    backingMap: Map<string, Map<string, number>>;
    constructor(file?: string);
    addOrUpdateUser(gameName: string, userId: string, mmr?: number): void;
    getUsersMMR(gameName: string, userId: string): number;
    getFileToSave(): any;
}
