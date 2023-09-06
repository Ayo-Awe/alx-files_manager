import { promisify } from 'util';
import mongodb from 'mongodb';
import db from '../utils/db';
import redis from '../utils/redis';

export default async function (req, res, next) {
  const users = db.client.collection('users');
  const findAsync = promisify(users.findOne);
  const token = req.headers['x-token'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userId = await redis.get(`auth_${token}`);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log(userId);

  const user = await findAsync.call(users, { _id: mongodb.ObjectId(userId) });
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = user;
  req.token = req.headers['x-token'];

  return next();
}
