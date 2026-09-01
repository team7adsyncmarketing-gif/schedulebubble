import express from 'express';
import {
  getMe,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);

export default router;
