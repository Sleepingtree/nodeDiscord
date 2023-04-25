import ConfigToSurrealMaping from '../model/runtimeConfig'
import { getDBConnection } from './surrealDBService'


export const getRuntimeConfig = async<T extends ConfigToSurrealMaping>(key: new () => T) => {
    const db = await getDBConnection('ref');
    const impl = new key()
    console.log(`loading config, ${key} with selector: ${impl.selector}`)
    const results = await db.select<T["returnedValue"]>(impl.selector);
    if (results.length > 1) {
        console.warn(`got ${results.length} results for config. ${key}`)
    }
    return results[0];
}