import { Request, Response } from 'express';
import dbClient from '../utils/db';
import sha1 from 'sha1';
import Bull from 'bull';

const userQueue = new Bull('userQueue');

class UsersController {
  static async postNew(req: Request, res: Response) {
    try {
      // Extract email and password from the request body
      const { email, password } = req.body;

      // Check if email is missing
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }

      // Check if password is missing
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      // Check if email already exists in the database
      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exists' });
      }

      // Hash the password using SHA1
      const hashedPassword = sha1(password);

      // Create a new user object
      const newUser = await dbClient.createUser(email, password);

      await userQueue.add({ userId: newUser._id });

      // Insert the new user into the database
      const result = await dbClient.db.collection('users').insertOne(newUser);

      // Respond with the new user data and status code 201 (Created)
      res.status(201).json({
        id: result.insertedId,
        email: newUser.email,
      });
      return res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req: Request, res: Response) {
    try {
      // Extract token from X-Token header
      const token = req.headers['x-token'];

      // If no token is provided, return Unauthorized
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the user ID from Redis based on the token
      const userId = await redisClient.get(`auth_${token}`);

      // If no user ID is found, return Unauthorized
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Find the user in the database based on the user ID
      const user = await dbClient.db.collection('users').findOne({
        _id: dbClient.ObjectId(userId),
      });

      // If no user is found, return Unauthorized
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Respond with the user object (email and id only)
      res.status(200).json({
        email: user.email,
        id: user._id,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default UsersController;
