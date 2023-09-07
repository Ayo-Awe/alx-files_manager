import { promisify } from 'util';
import sha1 from 'sha1';
import * as uuid from 'uuid';
import db from '../utils/db';
import extractBasicCredentials from '../utils/auth';
import redisClient from '../utils/redis';

export default class AuthController {
  static async getConnect(req, res) {
    const { authorization } = req.headers;

    if (!authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authorization.split(' ')[1];

    const { email, password } = extractBasicCredentials(base64Credentials);

    if (!email || !password) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const users = db.client.collection('users');
    const findAsync = promisify(users.findOne);

    const user = await findAsync.call(users, {
      email,
      password: sha1(password),
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = uuid.v4();
    const key = `auth_${token}`;
    const authExpiry = 60 * 60 * 24; // 24hrs

    await redisClient.set(key, user._id, authExpiry);

    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    await redisClient.del(`auth_${req.token}`);

    res.status(204).end();
  }
}
