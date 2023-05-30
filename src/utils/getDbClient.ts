import { Db, MongoClient } from "mongodb";

const MONGO_URI = "mongodb://localhost:27017/";
const MONGO_DB = "rafiki";

let db: null | Db = null;
export const getDbClient = async () => {
  if (!db) {
    const _db = await MongoClient.connect(MONGO_URI);
    db = _db.db(MONGO_DB);
  }
  return db;
};
