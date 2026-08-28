import SocialProfile from '../models/SocialProfile.js';
import { TwitterApi } from 'twitter-api-v2';
import axios from 'axios';

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

    // Save state + codeVerifier temporarily (associated with this user)
    oauthStateCache[state] = { codeVerifier, userId: req.user._id };

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

    let profile = await SocialProfile.findOne({ user: session.userId, platform: 'x' });
    if (profile) {
      profile.profileId = me.data.id;
      profile.profileName = me.data.username;
      profile.accessToken = accessToken;
      profile.refreshToken = refreshToken;
      profile.expiresAt = new Date(Date.now() + expiresIn * 1000);
      await profile.save();
    } else {
      await SocialProfile.create({
        user: session.userId,
        platform: 'x',
        profileId: me.data.id,
        profileName: me.data.username,
        accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      });
    }

    delete oauthStateCache[state];
    res.redirect('http://localhost:5173/dashboard'); // Redirect to frontend dashboard
  } catch (error) {
    console.error('X callback error:', error);
    res.status(500).send('Error authenticating with X');
  }
};

// ─── META (FACEBOOK/INSTAGRAM) OAUTH ─────────────────────────────────

export const connectMeta = async (req, res) => {
  try {
    const state = Math.random().toString(36).substring(7);
    oauthStateCache[state] = { userId: req.user._id };

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

    // Exchange code for access token
    const tokenResponse = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
      params: {
        client_id: process.env.META_CLIENT_ID,
        client_secret: process.env.META_CLIENT_SECRET,
        redirect_uri: process.env.META_REDIRECT_URI,
        code,
      }
    });

    const accessToken = tokenResponse.data.access_token;

    // Get user details and linked pages/instagram accounts
    // Get user details and linked pages/instagram accounts. 
    // IMPORTANT: We MUST request 'access_token' in the accounts edge to get the Page Access Token.
    const meResponse = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}&fields=id,name,accounts{instagram_business_account,id,name,access_token}`);
    
    const fbData = meResponse.data;
    console.log('--- FACEBOOK GRAPH API RESPONSE ---');
    console.log(JSON.stringify(fbData, null, 2));
    console.log('-----------------------------------');
    
    let actualProfileId = fbData.id;
    let actualProfileName = fbData.name;
    let actualAccessToken = accessToken; // Default to user token
    
    const pages = fbData.accounts?.data || [];
    const profilesToSave = [];

    if (pages.length > 0) {
      for (const page of pages) {
        // Save the Facebook Page
        profilesToSave.push({
          profileId: page.id,
          profileName: `${page.name} (Facebook)`,
          accessToken: page.access_token,
        });

        // Save the Instagram Business Account if it exists
        if (page.instagram_business_account) {
          profilesToSave.push({
            profileId: page.instagram_business_account.id,
            profileName: `${page.name} (Instagram)`,
            accessToken: page.access_token,
          });
        }
      }
    } else {
      // Fallback to the main user profile if no pages exist
      profilesToSave.push({
        profileId: fbData.id,
        profileName: fbData.name,
        accessToken: accessToken,
      });
    }

    // Upsert all found profiles for this user
    for (const p of profilesToSave) {
      await SocialProfile.findOneAndUpdate(
        { user: session.userId, platform: 'meta', profileId: p.profileId },
        {
          profileName: p.profileName,
          accessToken: p.accessToken,
        },
        { upsert: true, new: true }
      );
    }

    delete oauthStateCache[state];
    res.redirect('http://localhost:5173/dashboard'); // Redirect to frontend dashboard
  } catch (error) {
    const errData = error.response?.data || error.message || error;
    console.error('Meta callback error:', errData);
    res.status(500).send(`Error authenticating with Meta: ${JSON.stringify(errData)}`);
  }
};

// @desc    Connect Meta manually via tokens
// @route   POST /api/oauth/meta-manual
// @access  Private
export const connectMetaManual = async (req, res) => {
  try {
    const { accessToken, profileId } = req.body;
    
    if (!accessToken || !profileId) {
      return res.status(400).json({ message: 'Access Token and Profile/Page ID are required' });
    }

    // Verify the token by calling the Graph API
    let actualProfileName = profileId;
    try {
      const tokenResponse = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${accessToken}`);
      actualProfileName = tokenResponse.data.name || profileId;
    } catch (verifyErr) {
      return res.status(400).json({ message: 'Invalid Access Token. Facebook verification failed.' });
    }

    let profile = await SocialProfile.findOne({ user: req.user._id, platform: 'meta' });
    if (profile) {
      profile.accessToken = accessToken;
      profile.profileId = profileId;
      profile.profileName = `Manual: ${actualProfileName}`;
      await profile.save();
    } else {
      await SocialProfile.create({
        user: req.user._id,
        platform: 'meta',
        profileId,
        profileName: `Manual: ${actualProfileName}`,
        accessToken,
      });
    }
    res.status(200).json({ message: 'Meta Connected Manually' });
  } catch (err) {
    console.error('Meta manual connect error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Error verifying or saving manual Meta token' });
  }
};

// @desc    Connect Twitter (X) manually via token
// @route   POST /api/oauth/twitter-manual
// @access  Private
export const connectTwitterManual = async (req, res) => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ message: 'Access Token / Bearer Token is required' });
    }

    let profile = await SocialProfile.findOne({ user: req.user._id, platform: 'x' });
    if (profile) {
      profile.accessToken = accessToken;
      profile.profileId = 'manual-x';
      profile.profileName = 'Manual Twitter/X Account';
      await profile.save();
    } else {
      await SocialProfile.create({
        user: req.user._id,
        platform: 'x',
        profileId: 'manual-x',
        profileName: 'Manual Twitter/X Account',
        accessToken,
      });
    }
    res.status(200).json({ message: 'Twitter Connected Manually' });
  } catch (err) {
    console.error('Twitter manual connect error:', err);
    res.status(500).json({ message: 'Error saving manual Twitter token' });
  }
};

// @desc    Connect Google Business Profile manually via token and location ID
// @route   POST /api/oauth/google-manual
// @access  Private
export const connectGoogleManual = async (req, res) => {
  try {
    const { accessToken, locationId } = req.body;
    
    if (!accessToken || !locationId) {
      return res.status(400).json({ message: 'Access Token / API Key and Location ID are required' });
    }

    let profile = await SocialProfile.findOne({ user: req.user._id, platform: 'gmb' });
    if (profile) {
      profile.accessToken = accessToken;
      profile.profileId = locationId;
      profile.profileName = `Manual GMB: ${locationId}`;
      await profile.save();
    } else {
      await SocialProfile.create({
        user: req.user._id,
        platform: 'gmb',
        profileId: locationId,
        profileName: `Manual GMB: ${locationId}`,
        accessToken,
      });
    }
    res.status(200).json({ message: 'Google Business Profile Connected Manually' });
  } catch (err) {
    console.error('Google manual connect error:', err);
    res.status(500).json({ message: 'Error saving manual Google token' });
  }
};

// @desc    Get all connected social accounts for the user
// @route   GET /api/oauth/accounts
// @access  Private
export const getConnectedAccounts = async (req, res) => {
  try {
    const accounts = await SocialProfile.find({ user: req.user._id }).select(
      'platform profileId profileName expiresAt createdAt'
    );
    res.status(200).json(accounts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching connected accounts' });
  }
};

// @desc    Disconnect a social account
// @route   DELETE /api/oauth/disconnect/:id
// @access  Private
export const disconnectAccount = async (req, res) => {
  try {
    const account = await SocialProfile.findById(req.params.id);

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    if (account.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await account.deleteOne();
    res.status(200).json({ message: 'Account disconnected successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error disconnecting account' });
  }
};

// @desc    Mock connect platform for Sandbox
// @route   POST /api/oauth/connect/:platform
// @access  Private
export const mockConnectPlatform = async (req, res) => {
  try {
    const { platform } = req.params;
    let profileName = 'Demo Account';
    if (platform === 'google') profileName = 'Google Business Demo';
    if (platform === 'linkedin') profileName = 'LinkedIn Demo';
    
    let profile = await SocialProfile.findOne({ user: req.user._id, platform });
    if (profile) {
      profile.accessToken = 'mock_token';
      await profile.save();
    } else {
      await SocialProfile.create({
        user: req.user._id,
        platform,
        profileId: `mock_${platform}_123`,
        profileName,
        accessToken: 'mock_token',
      });
    }
    res.status(200).json({ message: `Connected mock ${platform} account successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error connecting account' });
  }
};

// @desc    Connect Telegram via manual tokens
// @route   POST /api/oauth/telegram
// @access  Private
export const connectTelegram = async (req, res) => {
  try {
    const botToken = req.body.botToken || process.env.TELEGRAM_BOT_TOKEN;
    const chatId = req.body.chatId || process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      return res.status(400).json({ message: 'Bot Token and Chat ID are required' });
    }

    let profile = await SocialProfile.findOne({ user: req.user._id, platform: 'telegram' });
    if (profile) {
      profile.accessToken = botToken;
      profile.profileId = chatId;
      profile.profileName = `Chat ID: ${chatId}`;
      await profile.save();
    } else {
      await SocialProfile.create({
        user: req.user._id,
        platform: 'telegram',
        profileId: chatId,
        profileName: `Chat ID: ${chatId}`,
        accessToken: botToken,
      });
    }
    res.status(200).json({ message: 'Telegram Connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error connecting Telegram' });
  }
};
