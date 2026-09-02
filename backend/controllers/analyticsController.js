import { supabase } from '../config/supabase.js';

// @desc    Get dashboard analytics summary
// @route   GET /api/analytics/summary
// @access  Private
export const getAnalyticsSummary = async (req, res) => {
  try {
    const { count: totalPosts } = await supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id);
    const { count: scheduledCount } = await supabase.from('publish_jobs').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('status', 'scheduled');
    const { count: publishedCount } = await supabase.from('publish_jobs').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('status', 'published');
    const { count: failedCount } = await supabase.from('publish_jobs').select('*', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('status', 'failed');
    
    let successRate = '0%';
    const totalProcessed = (publishedCount || 0) + (failedCount || 0);
    if (totalProcessed > 0) {
      successRate = Math.round(((publishedCount || 0) / totalProcessed) * 100) + '%';
    }

    res.json({
      publishedCount: publishedCount || 0,
      scheduledCount: scheduledCount || 0,
      totalPosts: totalPosts || 0,
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
    const { data: jobs, error } = await supabase
      .from('publish_jobs')
      .select('*, post:posts(*)')
      .eq('user_id', req.user.id)
      .in('status', ['scheduled', 'published'])
      .order('scheduled_for', { ascending: true });
      
    if (error) throw error;
    
    const postMap = new Map();
    for (const job of jobs) {
      if (!job.post) continue;
      const postId = job.post.id;
      if (!postMap.has(postId)) {
        postMap.set(postId, {
          _id: job.post.id,
          content: job.post.content,
          mediaUrls: job.post.media_urls,
          scheduledFor: job.post.scheduled_for || job.post.created_at,
          createdAt: job.post.created_at,
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
    const { data: jobs, error } = await supabase
      .from('publish_jobs')
      .select('platform, status, created_at')
      .eq('user_id', req.user.id);

    if (error) throw error;
    
    const platformCounts = {
      telegram: 0, x: 0, linkedin: 0, facebook: 0, instagram: 0, gmb: 0
    };
    let totalSuccess = 0;
    let totalFailed = 0;

    const timelineMap = new Map();

    jobs.forEach(job => {
      const p = job.platform.toLowerCase();
      if (platformCounts[p] !== undefined) {
        platformCounts[p]++;
      } else if (p === 'twitter') {
        platformCounts.x++;
      }

      if (job.status === 'published') totalSuccess++;
      if (job.status === 'failed') totalFailed++;

      if (job.status === 'published' && job.created_at) {
        const date = new Date(job.created_at).toISOString().split('T')[0];
        timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
      }
    });

    const platformBreakdown = Object.entries(platformCounts).map(([name, value]) => ({ name, value })).filter(p => p.value > 0);
    const timeline = Array.from(timelineMap.entries()).map(([date, posts]) => ({ date, posts })).sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      platformBreakdown: platformBreakdown.length > 0 ? platformBreakdown : [{ name: 'None', value: 1 }],
      timeline,
      successRate: totalSuccess + totalFailed > 0 ? Math.round((totalSuccess / (totalSuccess + totalFailed)) * 100) : 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
