import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';
import { supabase } from '../config/supabase.js';

// In-memory state storage (Not recommended for prod, but works for local dev)
const oauthStateCache = {};

// ─── X (TWITTER) OAUTH ───────────────────────────────────────────────

export const connectX = async (req, res) => {
  try {
    const client = new TwitterApi({ 
      clientId: process.env.X_CLIENT_ID, 
      clientSecret: process.env.X_CLIENT_SECRET 
    });

    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
      process.env.X_REDIRECT_URI,
      { scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] }
    );

    oauthStateCache[state] = { codeVerifier, userId: req.user.id };

    res.redirect(url);
  } catch (error) {
    console.error('X connect error:', error);
    res.status(500).json({ message: 'Error initiating X OAuth' });
  }
};

export const handleXCallback = async (req, res) => {
  const { state, code } = req.query;

  try {
    const session = oauthStateCache[state];
    if (!session) {
      return res.status(400).send('Invalid state or session expired.');
    }

    const client = new TwitterApi({ 
      clientId: process.env.X_CLIENT_ID, 
      clientSecret: process.env.X_CLIENT_SECRET 
    });

    const { client: loggedClient, accessToken, refreshToken, expiresIn } = await client.loginWithOAuth2({
      code,
      codeVerifier: session.codeVerifier,
      redirectUri: process.env.X_REDIRECT_URI,
    });

    const me = await loggedClient.v2.me();
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { data: profile, error } = await supabase
      .from('social_profiles')
      .upsert({
        user_id: session.userId,
        platform: 'x',
        platform_account_id: me.data.id,
        platform_username: me.data.username,
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, platform, platform_account_id' });

    delete oauthStateCache[state];
    res.redirect('https://schedulebubble-two.vercel.app/dashboard'); 
  } catch (error) {
    console.error('X callback error:', error);
    res.status(500).send('Error authenticating with X');
  }
};

// ─── GOOGLE OAUTH ──────────────────────────────────────────────────────

export const connectGoogle = async (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    oauthStateCache[state] = { userId: req.user.id };

    const scopes = 'https://www.googleapis.com/auth/business.manage';
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=${scopes}&state=${state}&access_type=offline&prompt=consent`;

    res.redirect(googleAuthUrl);
  } catch (error) {
    console.error('Google connect error:', error);
    res.status(500).json({ message: 'Error initiating Google OAuth' });
  }
};

export const handleGoogleCallback = async (req, res) => {
  const { state, code } = req.query;

  try {
    const session = oauthStateCache[state];
    if (!session) {
      return res.status(400).send('Invalid state or session expired.');
    }

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;
    
    // Fetch user info or just use a default name for now, as GMB accounts fetch requires another call
    // For simplicity, we just save the token and a placeholder ID if we don't fetch locations right away
    // Ideally, we'd fetch locations here, but for now we'll just save the token.
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await supabase
      .from('social_profiles')
      .upsert({
        user_id: session.userId,
        platform: 'google',
        platform_account_id: 'gmb_account_placeholder',
        platform_username: 'Google Business Profile',
        access_token: access_token,
        refresh_token: refresh_token || null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, platform, platform_account_id' });

    delete oauthStateCache[state];
    res.redirect('https://schedulebubble-two.vercel.app/dashboard');
  } catch (error) {
    console.error('Google callback error:', error.response?.data || error.message);
    res.status(500).send('Error authenticating with Google');
  }
};

// ─── LINKEDIN OAUTH ────────────────────────────────────────────────────

export const connectLinkedIn = async (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    oauthStateCache[state] = { userId: req.user.id };

    const scopes = 'w_member_social r_liteprofile';
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=http://localhost:5000/api/oauth/linkedin/callback&state=${state}&scope=${scopes}`;

    res.redirect(linkedinAuthUrl);
  } catch (error) {
    console.error('LinkedIn connect error:', error);
    res.status(500).json({ message: 'Error initiating LinkedIn OAuth' });
  }
};

export const handleLinkedInCallback = async (req, res) => {
  const { state, code } = req.query;

  try {
    const session = oauthStateCache[state];
    if (!session) {
      return res.status(400).send('Invalid state or session expired.');
    }

    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', 'http://localhost:5000/api/oauth/linkedin/callback');
    tokenParams.append('client_id', process.env.LINKEDIN_CLIENT_ID);
    tokenParams.append('client_secret', process.env.LINKEDIN_CLIENT_SECRET);

    const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', tokenParams, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token, expires_in } = tokenResponse.data;
    
    // Fetch profile
    const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    const profile = profileResponse.data;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    await supabase
      .from('social_profiles')
      .upsert({
        user_id: session.userId,
        platform: 'linkedin',
        platform_account_id: profile.id,
        platform_username: `${profile.localizedFirstName} ${profile.localizedLastName}`,
        access_token: access_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, platform, platform_account_id' });

    delete oauthStateCache[state];
    res.redirect('https://schedulebubble-two.vercel.app/dashboard');
  } catch (error) {
    console.error('LinkedIn callback error:', error.response?.data || error.message);
    res.status(500).send('Error authenticating with LinkedIn');
  }
};

// ─── META (FACEBOOK/INSTAGRAM) OAUTH ─────────────────────────────────

export const connectMeta = async (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    oauthStateCache[state] = { userId: req.user.id };

    const scopes = 'public_profile,pages_show_list,pages_read_engagement,pages_manage_posts,instagram_basic,instagram_content_publish,instagram_manage_insights,read_insights,instagram_business_manage_insights';
    const metaAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.META_CLIENT_ID}&redirect_uri=${process.env.META_REDIRECT_URI}&state=${state}&scope=${scopes}`;

    res.redirect(metaAuthUrl);
  } catch (error) {
    console.error('Meta connect error:', error);
    res.status(500).json({ message: 'Error initiating Meta OAuth' });
  }
};

export const handleMetaCallback = async (req, res) => {
  const { state, code } = req.query;

  try {
    const session = oauthStateCache[state];
    if (!session) {
      return res.status(400).send('Invalid state or session expired.');
    }

    const tokenResponse = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
      params: {
        client_id: process.env.META_CLIENT_ID,
        client_secret: process.env.META_CLIENT_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code,
      }
    });

    const accessToken = tokenResponse.data.access_token;
    const meResponse = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}&fields=id,name,accounts{instagram_business_account,id,name,access_token}`);
    
    const fbData = meResponse.data;
    const pages = fbData.accounts?.data || [];
    const profilesToSave = [];

    if (pages.length > 0) {
      for (const page of pages) {
        profilesToSave.push({
          user_id: session.userId,
          platform: 'meta',
          platform_account_id: page.id,
          platform_username: `${page.name} (Facebook)`,
          access_token: page.access_token,
          updated_at: new Date().toISOString()
        });

        if (page.instagram_business_account) {
          profilesToSave.push({
            user_id: session.userId,
            platform: 'meta',
            platform_account_id: page.instagram_business_account.id,
            platform_username: `${page.name} (Instagram)`,
            access_token: page.access_token,
            updated_at: new Date().toISOString()
          });
        }
      }
    } else {
      profilesToSave.push({
        user_id: session.userId,
        platform: 'meta',
        platform_account_id: fbData.id,
        platform_username: fbData.name,
        access_token: accessToken,
        updated_at: new Date().toISOString()
      });
    }

    for (const p of profilesToSave) {
      await supabase
        .from('social_profiles')
        .upsert(p, { onConflict: 'user_id, platform, platform_account_id' });
    }

    delete oauthStateCache[state];
    res.redirect('https://schedulebubble-two.vercel.app/dashboard');
  } catch (error) {
    console.error('Meta callback error:', error.response?.data || error.message);
    res.status(500).send(`Error authenticating with Meta`);
  }
};

export const connectMetaManual = async (req, res) => {
  try {
    const { accessToken, profileId } = req.body;
    if (!accessToken || !profileId) return res.status(400).json({ message: 'Access Token and Profile/Page ID are required' });

    let actualProfileName = profileId;
    try {
      const tokenResponse = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
      actualProfileName = tokenResponse.data.name || profileId;
    } catch (verifyErr) {
      return res.status(400).json({ message: 'Invalid Access Token. Facebook verification failed.' });
    }

    await supabase.from('social_profiles').upsert({
      user_id: req.user.id,
      platform: 'meta',
      platform_account_id: profileId,
      platform_username: `Manual: ${actualProfileName}`,
      access_token: accessToken,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, platform, platform_account_id' });

    res.status(200).json({ message: 'Meta Connected Manually' });
  } catch (err) {
    res.status(500).json({ message: 'Error verifying or saving manual Meta token' });
  }
};

export const connectTwitterManual = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'Access Token / Bearer Token is required' });

    await supabase.from('social_profiles').upsert({
      user_id: req.user.id,
      platform: 'x',
      platform_account_id: 'manual-x',
      platform_username: 'Manual Twitter/X Account',
      access_token: accessToken,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, platform, platform_account_id' });

    res.status(200).json({ message: 'Twitter Connected Manually' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving manual Twitter token' });
  }
};

export const connectGoogleManual = async (req, res) => {
  try {
    const { accessToken, locationId } = req.body;
    if (!accessToken || !locationId) return res.status(400).json({ message: 'Access Token / API Key and Location ID are required' });

    await supabase.from('social_profiles').upsert({
      user_id: req.user.id,
      platform: 'gmb',
      platform_account_id: locationId,
      platform_username: `Manual GMB: ${locationId}`,
      access_token: accessToken,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, platform, platform_account_id' });

    res.status(200).json({ message: 'Google Business Profile Connected Manually' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving manual Google token' });
  }
};

export const connectLinkedinManual = async (req, res) => {
  try {
    const { accessToken, profileId } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'Access Token is required' });

    await supabase.from('social_profiles').upsert({
      user_id: req.user.id,
      platform: 'linkedin',
      platform_account_id: profileId || 'manual-linkedin',
      platform_username: `Manual LinkedIn`,
      access_token: accessToken,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, platform, platform_account_id' });

    res.status(200).json({ message: 'LinkedIn Connected Manually' });
  } catch (err) {
    res.status(500).json({ message: 'Error saving manual LinkedIn token' });
  }
};

export const getConnectedAccounts = async (req, res) => {
  try {
    const { data: accounts, error } = await supabase
      .from('social_profiles')
      .select('id, platform, platform_account_id, platform_username, expires_at, created_at')
      .eq('user_id', req.user.id);

    if (error) throw error;
    
    // Map to old schema keys for frontend compatibility
    const mappedAccounts = accounts.map(a => ({
      _id: a.id,
      platform: a.platform,
      profileId: a.platform_account_id,
      profileName: a.platform_username,
      expiresAt: a.expires_at,
      createdAt: a.created_at
    }));

    // Inject System Telegram if env vars exist and user hasn't explicitly connected one
    const hasTelegram = mappedAccounts.some(a => a.platform === 'telegram');
    if (!hasTelegram && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      mappedAccounts.push({
        _id: 'system_telegram',
        platform: 'telegram',
        profileId: process.env.TELEGRAM_CHAT_ID,
        profileName: `System Configured`,
        createdAt: new Date().toISOString()
      });
    }

    res.status(200).json(mappedAccounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching connected accounts' });
  }
};

export const disconnectAccount = async (req, res) => {
  try {
    const { error } = await supabase
      .from('social_profiles')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.status(200).json({ message: 'Account disconnected successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error disconnecting account' });
  }
};

export const mockConnectPlatform = async (req, res) => {
  try {
    const { platform } = req.params;
    let profileName = 'Demo Account';
    if (platform === 'google') profileName = 'Google Business Demo';
    if (platform === 'linkedin') profileName = 'LinkedIn Demo';
    
    await supabase.from('social_profiles').upsert({
      user_id: req.user.id,
      platform,
      platform_account_id: `mock_${platform}_123`,
      platform_username: profileName,
      access_token: 'mock_token',
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, platform, platform_account_id' });

    res.status(200).json({ message: `Connected mock ${platform} account successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error connecting account' });
  }
};

export const connectTelegram = async (req, res) => {
  try {
    const botToken = req.body.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = req.body.chatId || process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) return res.status(400).json({ message: 'Bot Token and Chat ID are required' });

    await supabase.from('social_profiles').upsert({
      user_id: req.user.id,
      platform: 'telegram',
      platform_account_id: chatId,
      platform_username: `Chat ID: ${chatId}`,
      access_token: botToken,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, platform, platform_account_id' });

    res.status(200).json({ message: 'Telegram Connected' });
  } catch (err) {
    res.status(500).json({ message: 'Error connecting Telegram' });
  }
};
