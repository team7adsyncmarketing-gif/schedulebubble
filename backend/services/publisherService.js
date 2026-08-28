import PublishJob from '../models/PublishJob.js';
import SocialProfile from '../models/SocialProfile.js';
import axios from 'axios';
import { TwitterApi } from 'twitter-api-v2';

export const startPublisherService = () => {
  console.log('🔄 Starting Background Publisher Service (Runs every 60s)...');
  
  // Run every 60 seconds
  setInterval(async () => {
    try {
      const now = new Date();
      // Find jobs that are scheduled, and their scheduledFor time has passed
      const jobsToPublish = await PublishJob.find({
        status: 'scheduled',
        scheduledFor: { $lte: now }
      }).populate('post'); // Populate post if we need content in real app

      if (jobsToPublish.length > 0) {
        console.log(`[Publisher Service] Found ${jobsToPublish.length} jobs to publish at ${now.toISOString()}`);
        
        // Mark as processing immediately to prevent duplicate posting if API takes longer than 10s
        const jobIds = jobsToPublish.map(j => j._id);
        await PublishJob.updateMany({ _id: { $in: jobIds } }, { $set: { status: 'processing' } });
        
        // Track posts in this batch to prevent duplicate Telegram notifications when posting to multiple platforms
        const processedPostsInBatch = new Set();

        for (const job of jobsToPublish) {
          try {
            // Retrieve User's tokens for the given platform
            // Note: frontend sends 'twitter' or 'x', map them both to 'x' for lookup
            let lookupPlatform = job.platform;
            if (lookupPlatform === 'twitter') lookupPlatform = 'x';
            if (lookupPlatform === 'facebook' || lookupPlatform === 'instagram') lookupPlatform = 'meta';

            const isSandbox = process.env.SANDBOX_MODE === 'true';

            let profile = null;
            if (lookupPlatform !== 'telegram' && !isSandbox) {
              if (job.socialProfile) {
                profile = await SocialProfile.findById(job.socialProfile);
              } else {
                // Fallback for backwards compatibility with old jobs
                profile = await SocialProfile.findOne({ user: job.user, platform: lookupPlatform });
              }
              
              if (!profile || !profile.accessToken) {
                throw new Error(`No connected ${lookupPlatform} account found for this user.`);
              }
            }

            let postContent = job.post.content;
            
            // --- PLATFORM CONTENT EXTRACTION ---
            // The AI outputs bundled text like [FACEBOOK] ... [INSTAGRAM] ... 
            // We need to extract only the part meant for the current platform.
            const hasTags = /\[(FACEBOOK|INSTAGRAM|X|TWITTER|LINKEDIN|TELEGRAM|GMB|GOOGLE)\]/i.test(postContent);
            if (hasTags) {
              const extractPlatform = (content, platformName) => {
                const regex = new RegExp(`\\[${platformName.toUpperCase()}\\]\\n([\\s\\S]*?)(?=\\n\\[[A-Z]+\\]|$)`, 'i');
                const match = content.match(regex);
                return match && match[1] ? match[1].trim() : null;
              };

              let extracted = extractPlatform(postContent, job.platform);
              // Handle aliases
              if (!extracted && (job.platform === 'twitter' || job.platform === 'x')) {
                extracted = extractPlatform(postContent, job.platform === 'twitter' ? 'x' : 'twitter');
              }
              if (!extracted && (job.platform === 'google' || job.platform === 'gmb')) {
                extracted = extractPlatform(postContent, job.platform === 'google' ? 'gmb' : 'google');
              }
              
              if (extracted) {
                postContent = extracted;
              }
            }
            const hasMedia = job.post.mediaUrls && job.post.mediaUrls.length > 0;
            let primaryMediaUrl = hasMedia ? job.post.mediaUrls[0] : null;
            const isVideo = primaryMediaUrl && (primaryMediaUrl.match(/\.(mp4|mov|avi|webm)($|\?)/i) || primaryMediaUrl.includes('/video/upload/'));

            // Fix Aspect Ratio for Instagram using Cloudinary on-the-fly transformations (IMAGES ONLY)
            // Videos take too long to pad on the fly and cause Instagram to timeout. Reels accept any aspect ratio anyway.
            if (!isVideo && primaryMediaUrl && primaryMediaUrl.includes('res.cloudinary.com')) {
              const uploadIndex = primaryMediaUrl.indexOf('/upload/');
              if (uploadIndex !== -1) {
                // c_pad, w_1080, h_1080 creates a 1:1 square which is universally accepted
                const insertString = '/upload/c_pad,w_1080,h_1080,b_black/';
                primaryMediaUrl = primaryMediaUrl.substring(0, uploadIndex) + insertString + primaryMediaUrl.substring(uploadIndex + 8);
              }
            }

            if (isSandbox && lookupPlatform !== 'telegram') {
              console.log(`[Sandbox Mode] 🛡️ Simulating successful API call to ${job.platform} (Bypassing 402/Unauthorized)...`);
              // Simulate API delay
              await new Promise(resolve => setTimeout(resolve, 800));
            } else if (job.platform === 'twitter' || job.platform === 'x') {
              // --- X (TWITTER) PUBLISHING ---
              // Twitter OAuth 2.0 tokens expire after 2 hours. Refresh if needed.
              if (profile.refreshToken && profile.expiresAt && new Date() >= profile.expiresAt) {
                console.log(`[Publisher Service] Twitter token expired. Refreshing...`);
                const refreshClient = new TwitterApi({ 
                  clientId: process.env.X_CLIENT_ID, 
                  clientSecret: process.env.X_CLIENT_SECRET 
                });
                const { client: refreshedClient, accessToken, refreshToken, expiresIn } = await refreshClient.refreshOAuth2Token(profile.refreshToken);
                
                profile.accessToken = accessToken;
                profile.refreshToken = refreshToken;
                profile.expiresAt = new Date(Date.now() + expiresIn * 1000);
                await profile.save();
                console.log(`[Publisher Service] Twitter token refreshed successfully.`);
              }

              const client = new TwitterApi(profile.accessToken);
              const tweetText = hasMedia ? `${postContent}\n\n${primaryMediaUrl}` : postContent;
              const tweetRes = await client.v2.tweet(tweetText);
              if (tweetRes && tweetRes.data && tweetRes.data.id) {
                job.platformPostId = tweetRes.data.id;
              }

            } else if (job.platform === 'facebook') {
              // --- FACEBOOK PUBLISHING ---
              // User provides Facebook Page ID in the DB.
              const pageId = profile.profileId; 
              
              // We must exchange the User Token for a Page Token
              const pageTokenRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${profile.accessToken}`);
              const pageToken = pageTokenRes.data.access_token;

              if (!pageToken) {
                throw new Error("Could not retrieve Page Access Token. Check permissions.");
              }

              let fbRes;
              if (hasMedia) {
                const isVideo = primaryMediaUrl.match(/\.(mp4|mov|avi|webm)($|\?)/i) || primaryMediaUrl.includes('/video/upload/');
                if (isVideo) {
                  fbRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/videos`, {
                    file_url: primaryMediaUrl,
                    description: postContent,
                    access_token: pageToken
                  });
                } else {
                  fbRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
                    url: primaryMediaUrl,
                    message: postContent,
                    access_token: pageToken
                  });
                }
              } else {
                fbRes = await axios.post(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
                  message: postContent,
                  access_token: pageToken
                });
              }
              if (fbRes && fbRes.data && fbRes.data.id) {
                job.platformPostId = fbRes.data.id;
              }

            } else if (job.platform === 'instagram') {
              // --- INSTAGRAM PUBLISHING ---
              if (!hasMedia) {
                throw new Error("Instagram requires an image or video to publish.");
              }
              
              const pageId = profile.profileId;
              
              // Fetch IG Business ID from the Facebook Page ID
              const igInfoRes = await axios.get(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${profile.accessToken}`);
              if (!igInfoRes.data.instagram_business_account) {
                 throw new Error("No Instagram Business Account linked to this Facebook Page.");
              }
              
              const igUserId = igInfoRes.data.instagram_business_account.id;
              
              const mediaPayload = {
                caption: postContent,
                access_token: profile.accessToken
              };

              if (isVideo) {
                // Instagram deprecated 'VIDEO', all videos must be 'REELS'. 
                // They automatically share to feed unless specified otherwise.
                mediaPayload.media_type = 'REELS';
                mediaPayload.video_url = primaryMediaUrl;
              } else {
                mediaPayload.image_url = primaryMediaUrl;
              }

              const containerRes = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media`, mediaPayload);
              const creationId = containerRes.data.id;
              
              // Poll for publishing because videos take time to process
              let published = false;
              let retries = 0;
              const maxRetries = isVideo ? 36 : 5; // wait up to 3 minutes (36 * 5s) for video, 25s for image
              let lastError = null;
              
              while (!published && retries < maxRetries) {
                try {
                  if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                  }
                  
                  const publishRes = await axios.post(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
                    creation_id: creationId,
                    access_token: profile.accessToken
                  });
                  if (publishRes && publishRes.data && publishRes.data.id) {
                    job.platformPostId = publishRes.data.id;
                  } else {
                    job.platformPostId = creationId;
                  }
                  published = true;
                } catch (publishErr) {
                  lastError = publishErr;
                  const errCode = publishErr.response?.data?.error?.code;
                  // 9007 = media not ready
                  if (errCode === 9007 || publishErr.response?.data?.error?.error_subcode === 2207027) {
                    retries++;
                    console.log(`[Instagram] Media not ready yet. Retrying in 5s... (Attempt ${retries}/${maxRetries})`);
                  } else {
                    throw publishErr;
                  }
                }
              }

              if (!published) {
                throw new Error(`Failed to publish media after ${maxRetries} retries: ${lastError?.response?.data?.error?.message || lastError?.message}`);
              }
            } else if (job.platform === 'gmb' || job.platform === 'google') {
              // --- GOOGLE BUSINESS PROFILE PUBLISHING ---
              // The user manually pasted their location ID (e.g. 'accounts/xxx/locations/yyy')
              const parent = profile.profileId; 
              
              const gmbPayload = {
                languageCode: 'en-US',
                summary: postContent,
                callToAction: {
                  actionType: 'LEARN_MORE',
                  url: 'https://example.com'
                }
              };

              if (hasMedia && primaryMediaUrl) {
                const isVideo = primaryMediaUrl.match(/\.(mp4|mov|avi|webm)($|\?)/i) || primaryMediaUrl.includes('/video/upload/');
                gmbPayload.media = [
                  {
                    mediaFormat: isVideo ? 'VIDEO' : 'PHOTO',
                    sourceUrl: primaryMediaUrl
                  }
                ];
              }

              await axios.post(`https://mybusiness.googleapis.com/v4/${parent}/localPosts`, gmbPayload, {
                headers: {
                  Authorization: `Bearer ${profile.accessToken}`
                }
              });
            }

            // --- TELEGRAM LIVE BROADCAST ---
            let telegramToken = process.env.TELEGRAM_BOT_TOKEN;
            let telegramChatId = process.env.TELEGRAM_CHAT_ID;

            // Check if user manually connected a Telegram account in the UI
            const tgProfile = await SocialProfile.findOne({ user: job.user, platform: 'telegram' });
            if (tgProfile) {
              telegramToken = tgProfile.accessToken;
              telegramChatId = tgProfile.profileId;
            }

            const postIdStr = job.post._id.toString();
            const isTelegramJob = (job.platform === 'telegram');

            // Send to Telegram ONLY if it's explicitly a telegram job
            if (telegramToken && telegramChatId && isTelegramJob) {
              try {
                if (hasMedia && primaryMediaUrl) {
                  try {
                    const mediaResponse = await axios.get(primaryMediaUrl, { responseType: 'stream' });
                    const ext = primaryMediaUrl.split('.').pop().toLowerCase().split('?')[0];
                    const filename = `media.${ext || 'jpg'}`;
                    
                    let endpoint = 'sendPhoto';
                    let mediaField = 'photo';
                    
                    if (['mp4', 'mov', 'avi'].includes(ext)) {
                      endpoint = 'sendVideo';
                      mediaField = 'video';
                    } else if (['gif'].includes(ext)) {
                      endpoint = 'sendAnimation';
                      mediaField = 'animation';
                    }

                    const FormData = (await import('form-data')).default;
                    const formData = new FormData();
                    formData.append('chat_id', telegramChatId);
                    formData.append('caption', `📢 ${postContent}`);
                    formData.append(mediaField, mediaResponse.data, filename);

                    await axios.post(`https://api.telegram.org/bot${telegramToken}/${endpoint}`, formData, {
                      headers: formData.getHeaders()
                    });
                  } catch (mediaErr) {
                    console.error('[Telegram Broadcast] Media upload failed, falling back to text:', mediaErr.message);
                    await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                      chat_id: telegramChatId,
                      text: `📢 ${postContent}`,
                    });
                  }
                } else {
                  await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
                    chat_id: telegramChatId,
                    text: `📢 ${postContent}`,
                  });
                }
                console.log(`[Telegram Broadcast] 🚀 Successfully broadcasted to Telegram channel: ${telegramChatId}`);
              } catch (tgErr) {
                console.error('[Telegram Broadcast] ⚠️ Failed to send to Telegram:', tgErr.response?.data || tgErr.message);
              }
            }

            job.status = 'published';
            job.errorMessage = null; // Clear any previous errors if retrying
            await job.save();
            console.log(`[Publisher Service] ✅ Successfully published job ID: ${job._id} to platform: ${job.platform}`);
          } catch (jobError) {
            job.status = 'failed';
            job.errorMessage = jobError.response?.data?.error?.message || jobError.message || 'Unknown publishing error';
            await job.save();
            console.error(`[Publisher Service] ❌ Failed to publish job ID: ${job._id}`);
            console.error(`[Publisher Service] 🐛 Full Error:`, jobError.response?.data || jobError);
          }
        }
      }
    } catch (error) {
      console.error('[Publisher Service] Error during background publication:', error);
    }
  }, 10000); // Fast 10s check for snappy demos
};
