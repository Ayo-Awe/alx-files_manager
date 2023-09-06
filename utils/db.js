import { MongoClient } from "mongodb";
import { promisify } from "util";

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || "27017";
    const database = process.env.DB_DATABASE || "files_manager";

    MongoClient.connect(`mongodb://${host}:${port}`, (err, client) => {
      this.client = client.db(database);
    });
  }

  isAlive() {
    if (this.client) {
      return true;
    }

    return false;
  }

  async nbUsers() {
    const collection = this.client.collection("users");
    const asyncCount = promisify(collection.count);
    return asyncCount.call(collection);
  }

  async nbFiles() {
    const collection = this.client.collection("files");
    const asyncCount = promisify(collection.count);
    return asyncCount.call(collection);
  }
}

export default new DBClient();
