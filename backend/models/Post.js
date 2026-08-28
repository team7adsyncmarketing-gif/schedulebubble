import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 20000,
    },
    mediaUrls: [
      {
        type: String,
      },
    ],
    scheduledFor: {
      type: Date,
    },
    instagramFormat: {
      type: String,
      enum: ['feed', 'reel'],
      default: 'feed',
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model('Post', postSchema);

export default Post;
