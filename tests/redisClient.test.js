import redisClient from '../redisClient';

describe('redisClient', () => {
  it('should connect to Redis and return true for isAlive', async () => {
    const result = await redisClient.isAlive();
    expect(result).toBe(true);
  });

  it('should handle Redis connection errors and return false for isAlive', async () => {
    // Mocking Redis connection error
    jest.spyOn(redisClient.client, 'on').mockImplementationOnce((event, callback) => {
      if (event === 'error') {
        callback(new Error('Connection error'));
      }
    });

    const result = await redisClient.isAlive();
    expect(result).toBe(false);
  });.
});
