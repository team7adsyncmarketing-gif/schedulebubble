import mongoose from 'mongoose';

const mediaAssetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const MediaAsset = mongoose.model('MediaAsset', mediaAssetSchema);

export default MediaAsset;
