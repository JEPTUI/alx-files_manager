import { hash } from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // const usersCount = await dbClient.nbUsers();
      const userExists = await dbClient.client.db().collection('users').findOne({ email });

      if (userExists) {
        return res.status(400).json({ error: 'Already exists' });
      }

      const hashedPassword = hash(password);

      const usersCollection = dbClient.client.db().collection('users');
      const result = await usersCollection.insertOne({ email, password: hashedPassword });

      const newUser = { email, _id: result.insertedId };
      return res.status(201).json(newUser);
    } catch (error) {
      console.error(`Error creating new user: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user ID from Redis
    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Retrieve user from MongoDB
    const user = await dbClient.users.findOne({ _id: userId });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Return user object (email and id only)
    return res.status(200).json({ email: user.email, id: user._id });
  }
}

export default UsersController;
