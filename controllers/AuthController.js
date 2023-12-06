import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req: Request, res: Response) {
    try {
      // Extract credentials from the Authorization header using Basic Auth
      const credentials = Buffer.from(req.headers.authorization.split(' ')[1], 'base64').toString('utf-8');
      const [email, password] = credentials.split(':');

      // Find user in the database based on email and hashed password
      const user = await dbClient.db.collection('users').findOne({
        email,
        password: sha1(password),
      });

      // If no user is found, return Unauthorized
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Generate a random token using uuidv4
      const token = uuidv4();

      // Create a Redis key for storing the user ID with the token as the key
      const key = `auth_${token}`;

      // Store the user ID in Redis with a 24-hour expiration
      await redisClient.set(key, user._id.toString(), 24 * 60 * 60);

      // Respond with the generated token
      res.status(200).json({ token });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req: Request, res: Response) {
    try {
      // Extract token from X-Token header
      const token = req.headers['x-token'];

      // If no token is provided, return Unauthorized
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Delete the token from Redis
      await redisClient.del(`auth_${token}`);

      // Respond with no content (status code 204)
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default AuthController;
