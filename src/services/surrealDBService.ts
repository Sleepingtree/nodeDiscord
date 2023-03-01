import Surreal from "surrealdb.js";
import throwIfNull from "../util/throwIfUndefinedOrNull";

const dbConnection = process.env.DB_URL ?? throwIfNull("DB connection string is null");

const user = process.env.DB_USER ?? throwIfNull('DB username is null')
const pass = process.env.DB_PASS ?? throwIfNull('DB password is null')

export const getDBConnection = async (ns?: string) => {
    const db = new Surreal(dbConnection);

    await db.signin({ user, pass })
    await db.use(ns ?? 'ref', 'nodeDiscord');

    return db;
}