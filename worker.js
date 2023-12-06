import fileQueue from './utils/queue';
import dbClient from './utils/db';
import thumbnailGenerator from './utils/thumbnailGenerator';

fileQueue.process(async (job) => {
  try {
    const { userId, fileId } = job.data;

    if (!fileId || !userId) {
      throw new Error('Missing fileId or userId');
    }

    // Find the file in the database based on the fileId and userId
    const file = await dbClient.db.collection('files').findOne({
      _id: dbClient.ObjectId(fileId),
      userId: dbClient.ObjectId(userId),
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Generate thumbnails
    await thumbnailGenerator(file.localPath, file._id.toString());

    return file;
  } catch (error) {
    console.error(error.message);
    throw error;
  }
});
