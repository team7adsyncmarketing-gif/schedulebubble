import mongoose from 'mongoose';
import Post from './backend/models/Post.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const test = async () => {
  try {
    const contentStr = `
#AdSync #DigitalMarketing #ProductLaunch #AdAutomation #MarketingTools #BusinessGrowth #OnlineAdvertising #AdTech`;

    const post = new Post({
      user: new mongoose.Types.ObjectId(),
      content: contentStr,
      mediaUrls: [],
    });

    const error = post.validateSync();
    if (error) {
        console.error(error);
    } else {
        console.log("Validation passed");
    }
  } catch (e) {
    console.error("Error", e);
  }
};

test();
