import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';

const router = express.Router();

const hashData = (data) => {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
};

const sendToMetaCAPI = async (lead) => {
  try {
    if (!lead.fbclid && !lead.email && !lead.phone) return false;

    const { data: profile, error } = await supabase.from('profiles').select('meta_pixel_id, meta_access_token').eq('id', lead.user_id).single();

    if (error || !profile?.meta_pixel_id || !profile?.meta_access_token) return false;

    const pixelId = profile.meta_pixel_id;
    const accessToken = profile.meta_access_token;
    const testCode = process.env.META_TEST_CODE; 
    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
      data: [{
          event_name: 'Lead',
          event_time: eventTime,
          action_source: 'website',
          user_data: {
            ...(lead.fbclid ? { fbc: 'fb.1.' + eventTime + '.' + lead.fbclid } : {}),
            em: hashData(lead.email),
            ph: hashData(lead.phone),
          },
          custom_data: { lead_status: 'Qualified' },
      }],
    };

    if (testCode) payload.test_event_code = testCode;

    console.log('[Meta Payload]:', JSON.stringify(payload, null, 2));

    const url = 'https://graph.facebook.com/v19.0/' + pixelId + '/events?access_token=' + accessToken;
    const response = await axios.post(url, payload);

    return true;
  } catch (error) {
    console.error('[Meta CAPI] Error:', error.message);
    return false;
  }
};


const sendToGoogleAds = async (lead) => {
  try {
    if (!lead.gclid) return false;

    // Pull Google credentials from Supabase
    const { data: profile, error } = await supabase.from('profiles').select('google_customer_id, google_conversion_id').eq('id', lead.user_id).single();

    if (error || !profile?.google_customer_id) return false;

    console.log(`[Google Ads] Firing Offline Conversion for GCLID: ${lead.gclid} to Customer ID: ${profile.google_customer_id}`);

    // Standard Google Measurement Protocol Payload (Bypasses the 3-week Developer Token approval)
    const payload = {
      client_id: lead.gclid, // Using GCLID as client identifier
      events: [{
        name: 'offline_conversion_qualified',
        params: {
          gclid: lead.gclid,
          lead_status: 'Qualified',
          value: 100, // Arbitrary conversion value
          currency: 'USD'
        }
      }]
    };

    // If they provided a GA4/Google Ads Conversion ID, send it
    if (profile.google_conversion_id) {
       const url = `https://www.google-analytics.com/mp/collect?measurement_id=${profile.google_customer_id}&api_secret=${profile.google_conversion_id}`;
       await axios.post(url, payload);
    }
    
    return true;
  } catch (error) {
    console.error('[Google Ads] Error:', error.message);
    return false;
  }
};

router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required.' });

    const { data: lead, error } = await supabase.from('leads').update({ status, updated_at: new Date() }).eq('id', id).select().single();
    if (error || !lead) throw error;

    let metaResult = false;
    if (status === 'Qualified') {
      metaResult = await sendToMetaCAPI(lead);
      const googleResult = await sendToGoogleAds(lead);
    }

    res.status(200).json({ message: 'Lead status updated successfully', lead, meta_capi_fired: metaResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, name, email, phone, fbclid, gclid, source } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const { data: lead, error } = await supabase.from('leads').insert([{ user_id, name, email, phone, fbclid, gclid, source, status: 'New' }]).select().single();
    if (error) throw error;

    res.status(201).json({ message: 'Lead saved successfully', lead });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id || req.query.user_id; // Support both JWT and query params for now
    if (!userId) return res.status(401).json({ error: 'Unauthorized: Missing user ID' });

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

