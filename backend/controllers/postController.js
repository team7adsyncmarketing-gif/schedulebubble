import Post from '../models/Post.js';
import PublishJob from '../models/PublishJob.js';
import SocialProfile from '../models/SocialProfile.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  const { content, mediaUrls, platforms, destinations, scheduledFor, status, instagramFormat } = req.body;

  // destinations: [{ profileId?: string, platform: string }]
  // If destinations is not provided, fall back to mapping 'platforms' (for backwards compatibility)
  let finalDestinations = destinations || [];
  if (finalDestinations.length === 0 && platforms && platforms.length > 0) {
    finalDestinations = platforms.map(p => ({ platform: p }));
  }

  if (!content || finalDestinations.length === 0) {
    return res.status(400).json({ message: 'Content and at least one destination are required' });
  }

  try {
    // 2. Determine initial status
    let initialStatus = status || 'scheduled';
    let finalScheduledFor = scheduledFor ? new Date(scheduledFor) : new Date();
    const isSandbox = process.env.SANDBOX_MODE === 'true';

    // If user clicked "Post Now" (status === 'published'), set job status to 'scheduled' for current time so publisherService picks it up immediately
    const jobStatus = initialStatus === 'published' ? 'scheduled' : initialStatus;

    // 3. Create the post (canonical content)
    const post = await Post.create({
      user: req.user._id,
      content,
      mediaUrls: mediaUrls || [],
      scheduledFor: finalScheduledFor,
      instagramFormat: instagramFormat || 'feed',
    });

    // 4. Create isolated publish jobs for each destination
    const jobs = await Promise.all(
      finalDestinations.map(async (dest) => {
        return await PublishJob.create({
          user: req.user._id,
          post: post._id,
          platform: dest.platform,
          socialProfile: dest.profileId || null,
          status: jobStatus,
          scheduledFor: finalScheduledFor,
        });
      })
    );

    res.status(201).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating post' });
  }
};

// @desc    Get all posts for logged in user
// @route   GET /api/posts
// @access  Private
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching posts' });
  }
};

// @desc    Get scheduled posts queue
// @route   GET /api/posts/queue
// @access  Private
export const getQueue = async (req, res) => {
  try {
    const jobs = await PublishJob.find({ user: req.user._id, status: 'scheduled' })
      .populate('post')
      .sort({ scheduledFor: 1 });
    res.status(200).json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching queue' });
  }
};

// @desc    Get draft posts
// @route   GET /api/posts/drafts
// @access  Private
export const getDrafts = async (req, res) => {
  try {
    const drafts = await PublishJob.find({ user: req.user._id, status: 'draft' })
      .populate('post')
      .sort({ createdAt: -1 });
    res.status(200).json(drafts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching drafts' });
  }
};

// @desc    Get published posts history
// @route   GET /api/posts/published
// @access  Private
export const getPublished = async (req, res) => {
  try {
    const published = await PublishJob.find({ user: req.user._id, status: { $in: ['published', 'failed'] } })
      .populate('post')
      .sort({ updatedAt: -1 });
    res.status(200).json(published);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching published posts' });
  }
};

// @desc    Update a scheduled post
// @route   PUT /api/posts/queue/:id
// @access  Private
export const updateScheduledPost = async (req, res) => {
  try {
    const job = await PublishJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { content, scheduledFor, status, instagramFormat } = req.body;

    if (scheduledFor) {
      job.scheduledFor = new Date(scheduledFor);
    }
    
    if (status) {
      job.status = status;
    }
    
    await job.save();

    if (content !== undefined || instagramFormat !== undefined) {
      const post = await Post.findById(job.post);
      if (post) {
        if (content !== undefined) post.content = content;
        if (instagramFormat !== undefined) post.instagramFormat = instagramFormat;
        await post.save();
      }
    }

    res.status(200).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating job' });
  }
};

// @desc    Delete a scheduled post
// @route   DELETE /api/posts/queue/:id
// @access  Private
export const deleteScheduledPost = async (req, res) => {
  try {
    const job = await PublishJob.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    if (job.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await job.deleteOne();
    res.status(200).json({ message: 'Job removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting job' });
  }
};
