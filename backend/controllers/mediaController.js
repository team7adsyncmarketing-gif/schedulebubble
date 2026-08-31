import MediaAsset from '../models/MediaAsset.js';
import { uploadCloudinary } from '../config/cloudinary.js';
import { v2 as cloudinary } from 'cloudinary';

export const upload = uploadCloudinary;

// @desc    Upload a new media asset
// @route   POST /api/media/upload
// @access  Private
export const uploadAsset = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'User context missing' });

    // multer-storage-cloudinary might place the URL in path, secure_url, or url
    const fileUrl = req.file.path || req.file.secure_url || req.file.url;
    
    if (!fileUrl) {
      console.error("Cloudinary upload succeeded but no URL was returned. req.file:", req.file);
      return res.status(500).json({ message: 'Failed to retrieve image URL from Cloudinary' });
    }

    const mediaAsset = await MediaAsset.create({
      user: req.user._id,
      fileUrl,
      fileName: req.file.originalname,
    });

    res.status(201).json(mediaAsset);
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: 'Server error uploading asset' });
  }
};

// @desc    Get all media assets for logged in user
// @route   GET /api/media
// @access  Private
export const getAssets = async (req, res) => {
  try {
    const assets = await MediaAsset.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(assets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ message: 'Server error fetching assets' });
  }
};

// @desc    Delete a media asset
// @route   DELETE /api/media/:id
// @access  Private
export const deleteAsset = async (req, res) => {
  try {
    const asset = await MediaAsset.findOne({ _id: req.params.id, user: req.user._id });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Try to remove from Cloudinary if it's a Cloudinary URL
    if (asset.fileUrl && asset.fileUrl.includes('cloudinary.com')) {
      // Extract public_id from URL: e.g. https://res.cloudinary.com/cloud_name/image/upload/v1234567/winspire_uploads/filename.ext
      const parts = asset.fileUrl.split('/');
      const filenameWithExt = parts.pop();
      const folder = parts.pop();
      const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
      
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudErr) {
        console.error('Cloudinary deletion error:', cloudErr);
      }
    }

    await MediaAsset.deleteOne({ _id: asset._id });
    res.status(200).json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Server error deleting asset' });
  }
};
