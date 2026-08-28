import mongoose from 'mongoose';

const socialProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    platform: {
      type: String,
      required: true,
      enum: ['twitter', 'x', 'linkedin', 'facebook', 'instagram', 'google', 'meta', 'telegram'],
    },
    profileId: {
      type: String,
      required: true,
    },
    profileName: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    refreshToken: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a user can only connect the exact same page/profile once per platform
socialProfileSchema.index({ user: 1, platform: 1, profileId: 1 }, { unique: true });

const SocialProfile = mongoose.model('SocialProfile', socialProfileSchema);

export default SocialProfile;
