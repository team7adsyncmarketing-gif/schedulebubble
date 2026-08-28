import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createPost, getPosts, getQueue, updateScheduledPost, deleteScheduledPost, getDrafts, getPublished } from '../controllers/postController.js';

const router = express.Router();

router.route('/')
  .post(protect, createPost)
  .get(protect, getPosts);

router.route('/queue')
  .get(protect, getQueue);

router.route('/drafts')
  .get(protect, getDrafts);

router.route('/published')
  .get(protect, getPublished);

router.route('/queue/:id')
  .put(protect, updateScheduledPost)
  .delete(protect, deleteScheduledPost);

export default router;
