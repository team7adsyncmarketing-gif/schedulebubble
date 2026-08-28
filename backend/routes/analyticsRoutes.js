import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getAnalyticsSummary, getCalendarPosts, getDashboardData } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/summary', protect, getAnalyticsSummary);
router.get('/calendar', protect, getCalendarPosts);
router.get('/dashboard', protect, getDashboardData);

export default router;
