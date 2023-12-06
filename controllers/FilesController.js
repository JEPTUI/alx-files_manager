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
}

export default FilesController;
