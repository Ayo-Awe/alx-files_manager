import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AppController {
  static getStatus(req, res) {
    const payload = {
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    };

    return res.status(200).json(payload);
  }

  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();

    const payload = { users, files };

    return res.status(200).json(payload);
  }
}
