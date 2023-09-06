import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => {
      console.log(err);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const getAsync = promisify(this.client.get);
    return getAsync.call(this.client, key);
  }

  async set(key, value, duration) {
    const setAsync = promisify(this.client.set);
    await setAsync.call(this.client, key, value, 'EX', duration);
  }

  async del(key) {
    const delAsync = promisify(this.client.del);
    await delAsync.call(this.client, key);
  }
}

export default new RedisClient();
