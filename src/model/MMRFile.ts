export default class MMRFile{

    public static DEFAULT_MMR = 1000;
    backingMap: Map<string,Map<string,number>>;

    constructor(file?: string){
        if(file){
            const parsedFile = JSON.parse(file);
            const tempMap = new Map<string,Map<string,number>>();
            const gameKeys =  Object.keys(parsedFile);
            for(let gameName in gameKeys){
                if(parsedFile[gameKeys[gameName]]){
                    const innerTempMap = new Map<string,number>();
                    const unserNameKeys = Object.keys(parsedFile[gameKeys[gameName]]);
                    for(let userName in unserNameKeys){
                        if(parsedFile[gameKeys[gameName]][unserNameKeys[userName]]){
                            if(typeof parsedFile[gameKeys[gameName]][unserNameKeys[userName]] === 'number'){
                                innerTempMap.set(unserNameKeys[userName], parsedFile[gameKeys[gameName]][unserNameKeys[userName]]);
                            }else{
                                innerTempMap.set(unserNameKeys[userName], MMRFile.DEFAULT_MMR);
                            }
                        }
                        tempMap.set(gameKeys[gameName], innerTempMap);
                    }
                }
            }
            this.backingMap = tempMap;
        }else{
            this.backingMap = new Map<string,Map<string,number>>();
        }
    }

    public addOrUpdateUser(gameName:string, userId: string, mmr?: number){
        let innerMap = this.backingMap.get(gameName);
        if(!innerMap){
            innerMap = new Map<string, number>();
        }
       innerMap.set(userId, mmr?? MMRFile.DEFAULT_MMR);
       this.backingMap.set(gameName, innerMap);
    }

    public getUsersMMR(gameName:string, userId: string){
        return this.backingMap.get(gameName)?.get(userId) ?? MMRFile.DEFAULT_MMR;
    }

    public getFileToSave(){
        const returnedObject: any = new Object();
        for(let [key, value] of this.backingMap){
            const returnedInnerObject: any = new Object();
            for(let [innerKey, innerValue] of value){
                returnedInnerObject[innerKey] = innerValue;
            }
            returnedObject[key] = returnedInnerObject;
        }
        return returnedObject;
    }

}