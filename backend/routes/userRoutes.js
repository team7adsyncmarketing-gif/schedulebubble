import express from 'express';
import { uploadProfilePicture } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../controllers/mediaController.js';

const router = express.Router();

router.put('/profile-picture', protect, upload.single('image'), uploadProfilePicture);

export default router;
