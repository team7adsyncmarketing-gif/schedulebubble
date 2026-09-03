import { supabase } from '../backend/config/supabase.js';

async function testCreatePost() {
  const userId = 'bcad3726-0dae-4bfa-a4ff-14cd9b0fc322'; // Wait, I need a valid user id.
  
  // get a user
  const {data: users} = await supabase.from('profiles').select('id').limit(1);
  if (!users || users.length === 0) return console.log('no user');
  const uid = users[0].id;
  
  // get a social profile
  const {data: profiles} = await supabase.from('social_profiles').select('id, platform').eq('user_id', uid).limit(1);
  if (!profiles || profiles.length === 0) return console.log('no social profiles');
  const profile = profiles[0];

  // 1. Create Post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: uid,
      content: 'Test post',
      media_urls: ['media/123e4567/fake.png'],
    })
    .select()
    .single();

  if (postError) return console.log('postError', postError);

  // 2. Create Publish Jobs
  const jobsToInsert = [{
    user_id: uid,
    post_id: post.id,
    platform: profile.platform,
    social_profile_id: profile.id,
    status: 'scheduled',
    scheduled_for: new Date().toISOString(),
  }];

  const { data: jobs, error: jobsError } = await supabase
    .from('publish_jobs')
    .insert(jobsToInsert)
    .select();

  if (jobsError) return console.log('jobsError', jobsError);
  
  console.log('Success!', post, jobs);
}

testCreatePost();
