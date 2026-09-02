import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  connectX,
  handleXCallback,
  connectMeta,
  handleMetaCallback,
  getConnectedAccounts,
  disconnectAccount,
  mockConnectPlatform,
  connectTelegram,
  connectMetaManual,
  connectTwitterManual,
  connectGoogleManual,
  connectGoogle,
  handleGoogleCallback,
  connectLinkedIn,
  handleLinkedInCallback,
  connectLinkedinManual
} from '../controllers/oauthController.js';

const router = express.Router();

// Specific OAuth flows (X/Twitter and Meta)
router.get('/x', protect, connectX);
router.get('/x/callback', handleXCallback);
router.get('/meta', protect, connectMeta);
router.get('/meta/callback', handleMetaCallback);
router.get('/google', protect, connectGoogle);
router.get('/google/callback', handleGoogleCallback);
router.get('/linkedin', protect, connectLinkedIn);
router.get('/linkedin/callback', handleLinkedInCallback);

router.post('/connect/:platform', protect, mockConnectPlatform);

router.post('/meta-manual', protect, connectMetaManual);
router.post('/twitter-manual', protect, connectTwitterManual);
router.post('/google-manual', protect, connectGoogleManual);
router.post('/linkedin-manual', protect, connectLinkedinManual);
router.post('/telegram', protect, connectTelegram);

router.get('/accounts', protect, getConnectedAccounts);
router.delete('/disconnect/:id', protect, disconnectAccount);

export default router;
