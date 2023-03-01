import { AnyConfig } from '../model/runtimeConfig'
import { getDBConnection } from './surrealDBService'


export const getRuntimeConfig = async<T extends AnyConfig>(key: new () => T) => {
    const impl = new key()
    const db = await getDBConnection('ref');
    console.log(`loading config, ${key} with selector: ${impl.selector}`)
    const results = await db.select(impl.selector) as T["returnedValue"][];
    if (results.length > 1) {
        console.warn(`got ${results.length} results for config. ${key}`)
    }
    return results[0];
}