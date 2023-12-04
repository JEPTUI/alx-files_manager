import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthController {
  static async getConnect(req, res) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Extract and decode the Base64 credentials
    const credentialsBase64 = authHeader.split(' ')[1];
    const credentials = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    // Find user by email and password
    const hashedPassword = sha1(password);
    const user = await dbClient.users.findOne({ email, password: hashedPassword });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Generate a random token
    const token = uuidv4();

    // Store user ID in Redis with the token as key
    const redisKey = `auth_${token}`;
    await redisClient.set(redisKey, user._id.toString(), 24 * 60 * 60);

    // Return the token
    return res.status(200).json({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Delete the token in Redis
    await redisClient.del(`auth_${token}`);

    // Return nothing with status code 204
    return res.status(204).send();
  }
}

export default AuthController;
