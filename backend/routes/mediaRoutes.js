import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { upload, uploadAsset, getAssets, deleteAsset } from '../controllers/mediaController.js';

const router = express.Router();

router.post('/upload', protect, upload.single('image'), uploadAsset);
router.get('/', protect, getAssets);
router.delete('/:id', protect, deleteAsset);

export default router;
