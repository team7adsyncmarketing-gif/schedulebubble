import { supabase } from '../config/supabase.js';

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  const { content, mediaUrls, platforms, destinations, scheduledFor, status, instagramFormat } = req.body;

  let finalDestinations = destinations || [];
  if (finalDestinations.length === 0 && platforms && platforms.length > 0) {
    finalDestinations = platforms.map(p => ({ platform: p }));
  }

  if (!content || finalDestinations.length === 0) {
    return res.status(400).json({ message: 'Content and at least one destination are required' });
  }

  try {
    let initialStatus = status || 'scheduled';
    let finalScheduledFor = scheduledFor ? new Date(scheduledFor).toISOString() : new Date().toISOString();

    const jobStatus = initialStatus === 'published' ? 'scheduled' : initialStatus;

    // 1. Create Post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: req.user.id,
        content,
        media_urls: mediaUrls || [],
      })
      .select()
      .single();

    if (postError) throw postError;

    // 2. Create Publish Jobs
    const jobsToInsert = finalDestinations.map(dest => ({
      user_id: req.user.id,
      post_id: post.id,
      platform: dest.platform,
      social_profile_id: (dest.profileId && dest.profileId !== 'system_telegram') ? dest.profileId : null,
      status: jobStatus,
      scheduled_for: finalScheduledFor,
    }));

    const { data: jobs, error: jobsError } = await supabase
      .from('publish_jobs')
      .insert(jobsToInsert)
      .select();

    if (jobsError) throw jobsError;

    res.status(201).json(post);
  } catch (error) {
    console.error('createPost error:', error);
    res.status(500).json({ message: 'Server error creating post', error: error.message || error.toString() });
  }
};

// @desc    Get all posts for logged in user
// @route   GET /api/posts
// @access  Private
export const getPosts = async (req, res) => {
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(posts.map(p => ({ ...p, _id: p.id, user: p.user_id, mediaUrls: p.media_urls })));
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
    const { data: jobs, error } = await supabase
      .from('publish_jobs')
      .select('*, post:posts(*)')
      .eq('user_id', req.user.id)
      .eq('status', 'scheduled')
      .order('scheduled_for', { ascending: true });

    if (error) throw error;
    res.status(200).json(jobs.map(j => ({
      ...j,
      _id: j.id,
      scheduledFor: j.scheduled_for,
      errorMessage: j.error_message,
      post: { ...j.post, _id: j.post.id, mediaUrls: j.post.media_urls }
    })));
  } catch (error) {
    console.error('getQueue error:', error);
    res.status(500).json({ message: 'Server error fetching queue', error: error.message || error.toString() });
  }
};

// @desc    Get draft posts
// @route   GET /api/posts/drafts
// @access  Private
export const getDrafts = async (req, res) => {
  try {
    const { data: drafts, error } = await supabase
      .from('publish_jobs')
      .select('*, post:posts(*)')
      .eq('user_id', req.user.id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(drafts.map(j => ({
      ...j,
      _id: j.id,
      errorMessage: j.error_message,
      post: { ...j.post, _id: j.post.id, mediaUrls: j.post.media_urls }
    })));
  } catch (error) {
    console.error('getDrafts error:', error);
    res.status(500).json({ message: 'Server error fetching drafts', error: error.message || error.toString() });
  }
};

// @desc    Get published posts history
// @route   GET /api/posts/published
// @access  Private
export const getPublished = async (req, res) => {
  try {
    const { data: published, error } = await supabase
      .from('publish_jobs')
      .select('*, post:posts(*)')
      .eq('user_id', req.user.id)
      .in('status', ['published', 'failed'])
      .order('updated_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(published.map(j => ({
      ...j,
      _id: j.id,
      updatedAt: j.updated_at,
      scheduledFor: j.updated_at || j.scheduled_for || j.created_at,
      errorMessage: j.error_message,
      post: { ...j.post, _id: j.post.id, mediaUrls: j.post.media_urls }
    })));
  } catch (error) {
    console.error('getPublished error:', error);
    res.status(500).json({ message: 'Server error fetching published posts', error: error.message || error.toString() });
  }
};

// @desc    Update a scheduled post
// @route   PUT /api/posts/queue/:id
// @access  Private
export const updateScheduledPost = async (req, res) => {
  try {
    const { content, scheduledFor, status, instagramFormat } = req.body;

    // Check if job belongs to user
    const { data: jobCheck, error: jobCheckError } = await supabase
      .from('publish_jobs')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (jobCheckError || !jobCheck) {
      return res.status(404).json({ message: 'Job not found or not authorized' });
    }

    const updates = {};
    if (scheduledFor) updates.scheduled_for = new Date(scheduledFor).toISOString();
    if (status) updates.status = status;
    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length > 0) {
      await supabase.from('publish_jobs').update(updates).eq('id', jobCheck.id);
    }

    if (content !== undefined) {
      await supabase.from('posts').update({ content }).eq('id', jobCheck.post_id);
    }

    res.status(200).json({ message: 'Updated' });
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
    const { error } = await supabase
      .from('publish_jobs')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.status(200).json({ message: 'Job removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting job' });
  }
};
