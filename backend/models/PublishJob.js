import mongoose from 'mongoose';

const publishJobSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    socialProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SocialProfile',
      // Not required yet to maintain backwards compatibility with existing jobs
    },
    platform: {
      type: String,
      required: true,
      enum: ['instagram', 'facebook', 'gmb', 'linkedin', 'twitter', 'x', 'telegram'], // Including 'x' for compatibility, though frontend sends 'twitter'
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published', 'failed'],
      default: 'draft',
    },
    errorMessage: {
      type: String,
      default: null,
    },
    scheduledFor: {
      type: Date,
    },
    platformPostId: {
      type: String,
      default: null,
    },
    reach: {
      type: Number,
      default: 0,
    },
    engagement: {
      type: Number,
      default: 0,
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const PublishJob = mongoose.model('PublishJob', publishJobSchema);

export default PublishJob;
