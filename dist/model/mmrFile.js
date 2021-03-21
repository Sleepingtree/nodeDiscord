"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MMRFile {
    constructor(file) {
        if (file) {
            const parsedFile = JSON.parse(file);
            const tempMap = new Map();
            const gameKeys = Object.keys(parsedFile);
            for (let gameName in gameKeys) {
                if (parsedFile[gameKeys[gameName]]) {
                    const innerTempMap = new Map();
                    const unserNameKeys = Object.keys(parsedFile[gameKeys[gameName]]);
                    for (let userName in unserNameKeys) {
                        if (parsedFile[gameKeys[gameName]][unserNameKeys[userName]]) {
                            if (typeof parsedFile[gameKeys[gameName]][unserNameKeys[userName]] === 'number') {
                                innerTempMap.set(unserNameKeys[userName], parsedFile[gameKeys[gameName]][unserNameKeys[userName]]);
                            }
                            else {
                                innerTempMap.set(unserNameKeys[userName], MMRFile.DEFAULT_MMR);
                            }
                        }
                        tempMap.set(gameKeys[gameName], innerTempMap);
                    }
                }
            }
            this.backingMap = tempMap;
        }
        else {
            this.backingMap = new Map();
        }
    }
    addOrUpdateUser(gameName, userId, mmr) {
        let innerMap = this.backingMap.get(gameName);
        if (!innerMap) {
            innerMap = new Map();
        }
        innerMap.set(userId, mmr !== null && mmr !== void 0 ? mmr : MMRFile.DEFAULT_MMR);
        this.backingMap.set(gameName, innerMap);
    }
    getUsersMMR(gameName, userId) {
        var _a, _b;
        return (_b = (_a = this.backingMap.get(gameName)) === null || _a === void 0 ? void 0 : _a.get(userId)) !== null && _b !== void 0 ? _b : MMRFile.DEFAULT_MMR;
    }
    getFileToSave() {
        const returnedObject = new Object();
        for (let [key, value] of this.backingMap) {
            const returnedInnerObject = new Object();
            for (let [innerKey, innerValue] of value) {
                returnedInnerObject[innerKey] = innerValue;
            }
            returnedObject[key] = returnedInnerObject;
        }
        return returnedObject;
    }
}
exports.default = MMRFile;
MMRFile.DEFAULT_MMR = 1000;
//# sourceMappingURL=mmrFile.js.map