import User from '../models/User.js';

// @desc    Upload profile picture
// @route   PUT /api/users/profile-picture
// @access  Private
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // req.file.path contains the secure Cloudinary URL (if using multer-storage-cloudinary)
    user.profilePicture = req.file.path;
    await user.save();

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error uploading profile picture' });
  }
};
