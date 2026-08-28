import mongoose from 'mongoose';
import PublishJob from './backend/models/PublishJob.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const test = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    const jobs = await PublishJob.find({
        status: 'published',
        platformPostId: { $ne: null },
        platform: { $in: ['meta', 'facebook', 'instagram'] }
    });
    console.log("Found jobs:", jobs.length);
    for (const job of jobs) {
        console.log(`Job: ${job._id}, Platform: ${job.platform}, PostID: ${job.platformPostId}`);
    }
  } catch (e) {
    console.error("Error", e);
  } finally {
    mongoose.disconnect();
  }
};

test();
