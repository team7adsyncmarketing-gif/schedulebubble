import Post from '../models/Post.js';
import PublishJob from '../models/PublishJob.js';

// @desc    Get dashboard analytics summary
// @route   GET /api/analytics/summary
// @access  Private
export const getAnalyticsSummary = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments({ user: req.user._id });
    const scheduledCount = await PublishJob.countDocuments({ user: req.user._id, status: 'scheduled' });
    const publishedCount = await PublishJob.countDocuments({ user: req.user._id, status: 'published' });
    const failedCount = await PublishJob.countDocuments({ user: req.user._id, status: 'failed' });
    
    let successRate = '100%';
    const totalProcessed = publishedCount + failedCount;
    if (totalProcessed > 0) {
      successRate = Math.round((publishedCount / totalProcessed) * 100) + '%';
    }

    res.json({
      publishedCount,
      scheduledCount,
      totalPosts,
      successRate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get scheduled posts grouped by date
// @route   GET /api/analytics/calendar
// @access  Private
export const getCalendarPosts = async (req, res) => {
  try {
    const jobs = await PublishJob.find({ 
      user: req.user._id, 
      status: { $in: ['scheduled', 'published'] }
    }).populate('post').sort({ scheduledFor: 1, createdAt: -1 });
    
    // Group jobs by post ID so the UI gets unique posts with an array of platforms
    const postMap = new Map();
    for (const job of jobs) {
      if (!job.post) continue;
      const postId = job.post._id.toString();
      if (!postMap.has(postId)) {
        postMap.set(postId, {
          _id: job.post._id,
          content: job.post.content,
          mediaUrls: job.post.mediaUrls,
          scheduledFor: job.post.scheduledFor,
          createdAt: job.post.createdAt,
          status: job.status,
          platforms: []
        });
      }
      if (!postMap.get(postId).platforms.includes(job.platform)) {
        postMap.get(postId).platforms.push(job.platform);
      }
    }
    
    const posts = Array.from(postMap.values());
    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get detailed dashboard analytics for charts
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardData = async (req, res) => {
  try {
    const jobs = await PublishJob.find({ user: req.user._id });
    
    const platformCounts = {
      telegram: 0, x: 0, linkedin: 0, facebook: 0, instagram: 0, gmb: 0
    };
    let totalSuccess = 0;
    let totalFailed = 0;

    const timelineMap = new Map();

    jobs.forEach(job => {
      // Platform breakdown
      const p = job.platform.toLowerCase();
      if (platformCounts[p] !== undefined) {
        platformCounts[p]++;
      } else if (p === 'twitter') {
        platformCounts.x++;
      }

      // Success rate
      if (job.status === 'published') totalSuccess++;
      if (job.status === 'failed') totalFailed++;

      // Timeline (last 30 days published)
      if (job.status === 'published' && job.createdAt) {
        const date = new Date(job.createdAt).toISOString().split('T')[0];
        timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
      }
    });

    const platformBreakdown = Object.entries(platformCounts).map(([name, value]) => ({ name, value })).filter(p => p.value > 0);
    const timeline = Array.from(timelineMap.entries()).map(([date, posts]) => ({ date, posts })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      platformBreakdown: platformBreakdown.length > 0 ? platformBreakdown : [{ name: 'None', value: 1 }],
      timeline,
      successRate: totalSuccess + totalFailed > 0 ? Math.round((totalSuccess / (totalSuccess + totalFailed)) * 100) : 100,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
