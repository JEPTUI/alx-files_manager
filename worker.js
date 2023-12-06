import fileQueue from './utils/queue';
import dbClient from './utils/db';
import thumbnailGenerator from './utils/thumbnailGenerator';
import Bull from 'bull';
import nodemailer from 'nodemailer';

const userQueue = new Bull('userQueue');

userQueue.process(async (job) => {
  try {
    const { userId } = job.data;

    if (!userId) {
      throw new Error('Missing userId in job');
    }

    // Fetch user from DB
    const user = await dbClient.getUserById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // In a real scenario, you would send an email using a third-party service like Mailgun.
    // For now, just log the welcome message to the console.
    console.log(`Welcome ${user.email}!`);
  } catch (error) {
    console.error('Error processing userQueue job:', error);
  }
});

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
