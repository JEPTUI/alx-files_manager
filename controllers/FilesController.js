import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req: Request, res: Response) {
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

      // Extract file details from the request body
      const { name, type, parentId = 0, isPublic = false, data } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Validate parentId if provided
      if (parentId !== 0) {
        const parentFile = await dbClient.db.collection('files').findOne({
          _id: dbClient.ObjectId(parentId),
        });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Prepare file document to be inserted into the database
      const newFile = {
        userId: dbClient.ObjectId(userId),
        name,
        type,
        isPublic,
        parentId: dbClient.ObjectId(parentId),
      };

      // Handle file data and local storage for non-folder types
      if (type !== 'folder') {
        // Set the storing folder path
        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';

        // Create the folder if not present
        if (!fs.existsSync(folderPath)) {
          fs.mkdirSync(folderPath, { recursive: true });
        }

        // Generate a unique filename using UUID
        const filename = `${uuidv4()}`;

        // Construct the local path
        const localPath = path.join(folderPath, filename);

        // Save the file locally
        fs.writeFileSync(localPath, Buffer.from(data, 'base64'));

        // Add localPath to the new file document
        newFile.localPath = localPath;
      }

      // Insert the new file document into the database
      const result = await dbClient.db.collection('files').insertOne(newFile);

      // Respond with the new file and status code 201 (Created)
      res.status(201).json({
        id: result.insertedId,
        name: newFile.name,
        type: newFile.type,
        isPublic: newFile.isPublic,
        parentId: newFile.parentId,
        localPath: newFile.localPath,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req: Request, res: Response) {
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

      // Extract file ID from request parameters
      const fileId = req.params.id;

      // Find the file in the database based on the file ID and user ID
      const file = await dbClient.db.collection('files').findOne({
        _id: dbClient.ObjectId(fileId),
        userId: dbClient.ObjectId(userId),
      });

      // If no file is found, return Not Found
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Respond with the file document
      res.status(200).json(file);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getIndex(req: Request, res: Response) {
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

      // Extract parentId and page from query parameters
      const parentId = req.query.parentId || 0;
      const page = parseInt(req.query.page, 10) || 0;
      const perPage = 20;

      // Aggregate to get paginated files based on parentId and userId
      const files = await dbClient.db
        .collection('files')
        .aggregate([
          {
            $match: {
              userId: dbClient.ObjectId(userId),
              parentId: dbClient.ObjectId(parentId),
            },
          },
          {
            $skip: page * perPage,
          },
          {
            $limit: perPage,
          },
        ])
        .toArray();

      // Respond with the list of files
      res.status(200).json(files);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putPublish(req: Request, res: Response) {
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

      // Extract file ID from request parameters
      const fileId = req.params.id;

      // Find the file in the database based on the file ID and user ID
      const file = await dbClient.db.collection('files').findOne({
        _id: dbClient.ObjectId(fileId),
        userId: dbClient.ObjectId(userId),
      });

      // If no file is found, return Not Found
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Update the value of isPublic to true
      await dbClient.db.collection('files').updateOne(
        { _id: dbClient.ObjectId(fileId) },
        { $set: { isPublic: true } }
      );

      // Respond with the updated file document
      res.status(200).json({
        id: file._id,
        name: file.name,
        type: file.type,
        isPublic: true,
        parentId: file.parentId,
        localPath: file.localPath,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async putUnpublish(req: Request, res: Response) {
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

      // Extract file ID from request parameters
      const fileId = req.params.id;

      // Find the file in the database based on the file ID and user ID
      const file = await dbClient.db.collection('files').findOne({
        _id: dbClient.ObjectId(fileId),
        userId: dbClient.ObjectId(userId),
      });

      // If no file is found, return Not Found
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Update the value of isPublic to false
      await dbClient.db.collection('files').updateOne(
        { _id: dbClient.ObjectId(fileId) },
        { $set: { isPublic: false } }
      );

      // Respond with the updated file document
      res.status(200).json({
        id: file._id,
        name: file.name,
        type: file.type,
        isPublic: false,
        parentId: file.parentId,
        localPath: file.localPath,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default FilesController;
