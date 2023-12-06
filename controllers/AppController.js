import { Request, Response } from 'express';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static async getStatus(req: Request, res: Response) {
    const redisAlive = redisClient.isAlive();
    const dbAlive = dbClient.isAlive();

    res.status(200).json({
      redis: redisAlive,
      db: dbAlive,
    });
  }

  static async getStats(req: Request, res: Response) {
    try {
      await dbClient.connect(); // Ensure the connection to MongoDB is established
      const nbUsers = await dbClient.nbUsers();
      const nbFiles = await dbClient.nbFiles();

      res.status(200).json({
        users: nbUsers,
        files: nbFiles,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default AppController;
