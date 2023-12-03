import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    // Create a redis client
    this.client = redis.createClient();

    // Handle redis client errors
    this.client.on('error', (err) => {
      console.error(`Redis client error: ${err}`);
    });
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const getAsync = promisify(this.client.get).bind(this.client);
    return getAsync(key);
  }

  async set(key, value, duration) {
    const setAsync = promisify(this.client.setex).bind(this.client);
    return setAsync(key, duration, value);
  }

  async del(key) {
    const delAsync = promisify(this.client.del).bind(this.client);
    return delAsync(key);
  }
}

// Create and export an instance of redisclient
const redisClient = new RedisClient();
module.exports = redisClient;
