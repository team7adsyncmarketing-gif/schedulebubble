import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';
import { supabase } from '../config/supabase.js';

export const startPublisherService = () => {
  console.log('🔄 Starting Background Publisher Service (Runs every 10s)...');
  
  setInterval(async () => {
    try {
      const now = new Date().toISOString();
      
      const { data: jobsToPublish, error: fetchError } = await supabase
        .from('publish_jobs')
        .select('*, post:posts(*)')
        .eq('status', 'scheduled')
        .lte('scheduled_for', now);

      if (fetchError) throw fetchError;

      if (jobsToPublish && jobsToPublish.length > 0) {
        console.log(`[Publisher Service] Found ${jobsToPublish.length} jobs to publish`);
        
        const jobIds = jobsToPublish.map(j => j.id);
        await supabase
          .from('publish_jobs')
          .update({ status: 'processing' })
          .in('id', jobIds);

        for (const job of jobsToPublish) {
          try {
            let lookupPlatform = job.platform;
            if (lookupPlatform === 'twitter') lookupPlatform = 'x';
            if (lookupPlatform === 'facebook' || lookupPlatform === 'instagram') lookupPlatform = 'meta';

            const isSandbox = process.env.SANDBOX_MODE === 'true';
            let profile = null;

            if (lookupPlatform !== 'telegram' && !isSandbox) {
              if (job.social_profile_id) {
                const { data: p } = await supabase.from('social_profiles').select('*').eq('id', job.social_profile_id).single();
                profile = p;
              } else {
                const { data: p } = await supabase.from('social_profiles').select('*').eq('user_id', job.user_id).eq('platform', lookupPlatform).limit(1).single();
                profile = p;
              }
              
              if (!profile || !profile.access_token) {
                throw new Error(`No connected ${lookupPlatform} account found for this user.`);
              }
            }

            let postContent = job.post.content;
            
            const hasTags = /\[(FACEBOOK|INSTAGRAM|X|TWITTER|LINKEDIN|TELEGRAM|GMB|GOOGLE)\]/i.test(postContent);
            if (hasTags) {
              const extractPlatform = (content, platformName) => {
                const regex = new RegExp(`\\[${platformName.toUpperCase()}\\]\\n([\\s\\S]*?)(?=\\n\\[[A-Z]+\\]|$)`, 'i');
                const match = content.match(regex);
                return match && match[1] ? match[1].trim() : null;
              };

              let extracted = extractPlatform(postContent, job.platform);
              if (!extracted && (job.platform === 'twitter' || job.platform === 'x')) extracted = extractPlatform(postContent, job.platform === 'twitter' ? 'x' : 'twitter');
              if (!extracted && (job.platform === 'google' || job.platform === 'gmb')) extracted = extractPlatform(postContent, job.platform === 'google' ? 'gmb' : 'google');
              
              if (extracted) postContent = extracted;
            }

            const hasMedia = job.post.media_urls && job.post.media_urls.length > 0;
            let primaryMediaUrl = hasMedia ? job.post.media_urls[0] : null;
            const isVideo = primaryMediaUrl && (primaryMediaUrl.match(/\.(mp4|mov|avi|webm)($|\?)/i) || primaryMediaUrl.includes('/video/upload/'));

            if (!isVideo && primaryMediaUrl && primaryMediaUrl.includes('res.cloudinary.com')) {
              const uploadIndex = primaryMediaUrl.indexOf('/upload/');
              if (uploadIndex !== -1) {
                const insertString = '/upload/c_pad,w_1080,h_1080,b_black/';
                primaryMediaUrl = primaryMediaUrl.substring(0, uploadIndex) + insertString + primaryMediaUrl.substring(uploadIndex + 8);
              }
            }

            if (isSandbox && lookupPlatform !== 'telegram') {
              console.log(`[Sandbox Mode] 🛡️ Simulating successful API call to ${job.platform}`);
              await new Promise(resolve => setTimeout(resolve, 800));
            } else if (job.platform === 'twitter' || job.platform === 'x') {
              if (profile.refresh_token && profile.expires_at && new Date() >= new Date(profile.expires_at)) {
                const refreshClient = new TwitterApi({ clientId: process.env.X_CLIENT_ID, clientSecret: process.env.X_CLIENT_SECRET });
                const { client: refreshedClient, accessToken, refreshToken, expiresIn } = await refreshClient.refreshOAuth2Token(profile.refresh_token);
                
                profile.access_token = accessToken;
                profile.refresh_token = refreshToken;
                profile.expires_at = new Date(Date.now() + expiresIn * 1000).toISOString();
                await supabase.from('social_profiles').update({ access_token: accessToken, refresh_token: refreshToken, expires_at: profile.expires_at }).eq('id', profile.id);
              }

              const client = new TwitterApi(profile.access_token);
              const tweetText = hasMedia ? `${postContent}\n\n${primaryMediaUrl}` : postContent;
              const tweetRes = await client.v2.tweet(tweetText);
              if (tweetRes?.data?.id) job.platform_post_id = tweetRes.data.id;

            } else if (job.platform === 'facebook') {
              const pageId = profile.platform_account_id; 
              const pageTokenRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${profile.access_token}`);
              const pageToken = pageTokenRes.data.access_token;
              if (!pageToken) throw new Error("Could not retrieve Page Access Token.");

              let fbRes;
              if (hasMedia) {
                if (isVideo) {
                  fbRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/videos`, { file_url: primaryMediaUrl, description: postContent, access_token: pageToken });
                } else {
                  fbRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, { url: primaryMediaUrl, message: postContent, access_token: pageToken });
                }
              } else {
                fbRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, { message: postContent, access_token: pageToken });
              }
              if (fbRes?.data?.id) job.platform_post_id = fbRes.data.id;

            } else if (job.platform === 'instagram') {
              if (!hasMedia) throw new Error("Instagram requires an image or video.");
              
              const pageId = profile.platform_account_id;
              const igInfoRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${profile.access_token}`);
              if (!igInfoRes.data.instagram_business_account) throw new Error("No IG Business Account linked.");
              
              const igUserId = igInfoRes.data.instagram_business_account.id;
              const mediaPayload = { caption: postContent, access_token: profile.access_token };

              if (isVideo) {
                mediaPayload.media_type = 'REELS';
                mediaPayload.video_url = primaryMediaUrl;
              } else {
                mediaPayload.image_url = primaryMediaUrl;
              }

              const containerRes = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media`, mediaPayload);
              const creationId = containerRes.data.id;
              
              let published = false, retries = 0, maxRetries = isVideo ? 36 : 5, lastError = null;
              
              while (!published && retries < maxRetries) {
                try {
                  if (retries > 0) await new Promise(resolve => setTimeout(resolve, 5000));
                  const publishRes = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, { creation_id: creationId, access_token: profile.access_token });
                  job.platform_post_id = publishRes?.data?.id || creationId;
                  published = true;
                } catch (publishErr) {
                  lastError = publishErr;
                  const errCode = publishErr.response?.data?.error?.code;
                  if (errCode === 9007 || publishErr.response?.data?.error?.error_subcode === 2207027) {
                    retries++;
                  } else {
                    throw publishErr;
                  }
                }
              }

              if (!published) throw new Error(`Failed to publish media: ${lastError?.message}`);
            } else if (job.platform === 'gmb' || job.platform === 'google') {
              const parent = profile.platform_account_id; 
              const gmbPayload = {
                languageCode: 'en-US',
                summary: postContent,
                callToAction: { actionType: 'LEARN_MORE', url: 'https://example.com' }
              };
              if (hasMedia && primaryMediaUrl) {
                gmbPayload.media = [{ mediaFormat: isVideo ? 'VIDEO' : 'PHOTO', sourceUrl: primaryMediaUrl }];
              }
              await axios.post(`https://mybusiness.googleapis.com/v4/${parent}/localPosts`, gmbPayload, { headers: { Authorization: `Bearer ${profile.access_token}` } });
            }

            let telegramToken = process.env.TELEGRAM_BOT_TOKEN;
            let telegramChatId = process.env.TELEGRAM_CHAT_ID;
            const { data: tgProfile } = await supabase.from('social_profiles').select('*').eq('user_id', job.user_id).eq('platform', 'telegram').single();
            if (tgProfile) {
              telegramToken = tgProfile.access_token;
              telegramChatId = tgProfile.platform_account_id;
            }

            if (telegramToken && telegramChatId && job.platform === 'telegram') {
              try {
                if (hasMedia && primaryMediaUrl) {
                  try {
                    const mediaResponse = await axios.get(primaryMediaUrl, { responseType: 'stream' });
                    const ext = primaryMediaUrl.split('.').pop().toLowerCase().split('?')[0];
                    const filename = `media.${ext || 'jpg'}`;
                    let endpoint = 'sendPhoto', mediaField = 'photo';
                    if (['mp4', 'mov', 'avi'].includes(ext)) { endpoint = 'sendVideo'; mediaField = 'video'; }
                    
                    const FormData = (await import('form-data')).default;
                    const formData = new FormData();
                    formData.append('chat_id', telegramChatId);
                    formData.append('caption', `📢 ${postContent}`);
                    formData.append(mediaField, mediaResponse.data, filename);

                    await axios.post(`https://api.telegram.org/bot${telegramToken}/${endpoint}`, formData, { headers: formData.getHeaders() });
                  } catch (e) {
                    await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, { chat_id: telegramChatId, text: `📢 ${postContent}` });
                  }
                } else {
                  await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, { chat_id: telegramChatId, text: `📢 ${postContent}` });
                }
              } catch (e) {}
            }

            await supabase.from('publish_jobs').update({ status: 'published', error_message: null, platform_post_id: job.platform_post_id || null, updated_at: new Date().toISOString() }).eq('id', job.id);
            console.log(`[Publisher Service] ✅ Successfully published job ID: ${job.id}`);
          } catch (jobError) {
            const detailedError = jobError.response?.data?.error?.message || jobError.message || 'Unknown error';
            await supabase.from('publish_jobs').update({ status: 'failed', error_message: detailedError, updated_at: new Date().toISOString() }).eq('id', job.id);
            console.error(`[Publisher Service] ❌ Failed to publish job ID: ${job.id}. Error: ${detailedError}`);
          }
        }
      }
    } catch (error) {
      console.error('[Publisher Service] Error:', error);
    }
  }, 10000);
};
