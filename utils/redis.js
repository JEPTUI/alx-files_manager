import redis from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    // Create a redis client
    this.client = redis.createClient();
    this.isClientConnected = true;
    this.client.on('error', (err) => {
      console.error('Redis client failed to connect:', err.message || err.toString());
      this.isClientConnected = false;
    });
  }

  isAlive() {
    return this.isClientConnected();
  }

  async get(key) {
    const getAsync = promisify(this.client.GET).bind(this.client);
    return getAsync(key);
  }

  async set(key, value, duration) {
    await promisify(this.client.SETEX).bind(this.client)(key, duration, value);
  }

  async del(key) {
    await promisify(this.client.DEL).bind(this.client)(key);
  }
}

// Create and export an instance of redisclient
export const redisClient = new RedisClient();
module.exports = redisClient;
