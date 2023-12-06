import dbClient from '../dbClient';

describe('dbClient', () => {
  it('should connect to MongoDB and return true for isAlive', async () => {
    const result = await dbClient.isAlive();
    expect(result).toBe(true);
  });

  it('should handle MongoDB connection errors and return false for isAlive', async () => {
    // Mocking MongoDB connection error
    jest.spyOn(dbClient.client, 'on').mockImplementationOnce((event, callback) => {
      if (event === 'error') {
        callback(new Error('Connection error'));
      }
    });

    const result = await dbClient.isAlive();
    expect(result).toBe(false);
  });

  it('should correctly get the number of users from MongoDB', async () => {
    const result = await dbClient.nbUsers();
    expect(result).toBeGreaterThan(0); // Adjust based on your actual data
  });
});
