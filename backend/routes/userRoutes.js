import express from 'express';
import { uploadProfilePicture } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadCloudinary } from '../config/cloudinary.js';

const router = express.Router();

// Route for uploading a profile picture
router.put('/profile-picture', protect, uploadCloudinary.single('image'), uploadProfilePicture);

export default router;
