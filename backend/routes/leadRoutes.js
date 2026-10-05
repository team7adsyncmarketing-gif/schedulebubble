import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import supabase from '../config/supabase.js';

const router = express.Router();

// Helper: Hash email/phone with SHA256 for Meta privacy requirements
const hashData = (data) => {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
};

// Module 3: The Meta CAPI Sync Engine (Now Multi-Tenant)
const sendToMetaCAPI = async (lead) => {
  try {
    if (!lead.fbclid) {
      console.log('[Meta CAPI] No fbclid found, skipping Meta sync.');
      return false;
    }

    // NEW: Dynamically fetch the client's unique Meta keys from Supabase profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('meta_pixel_id, meta_access_token')
      .eq('id', lead.user_id)
      .single();

    if (error || !profile?.meta_pixel_id || !profile?.meta_access_token) {
      console.error('[Meta CAPI] Client has not setup Meta Integration yet.');
      return false;
    }

    const pixelId = profile.meta_pixel_id;
    const accessToken = profile.meta_access_token;
    
    // We still keep testCode in .env just for your internal testing, but clients won't use it
    const testCode = process.env.META_TEST_CODE; 

    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
      data: [
        {
          event_name: 'Lead',
          event_time: eventTime,
          action_source: 'website',
          user_data: {
            fbc: "fb.1..",
            em: hashData(lead.email),
            ph: hashData(lead.phone),
          },
          custom_data: {
            lead_status: 'Qualified',
          },
        },
      ],
    };

    if (testCode) {
      payload.test_event_code = testCode;
    }

    console.log('[Meta Payload]:', JSON.stringify(payload, null, 2));

    const url = "https://graph.facebook.com/v19.0//events?access_token=";
    const response = await axios.post(url, payload);

    console.log('[Meta CAPI] Successfully sent Qualified Lead event to Client Pixel:', pixelId);
    return true;
  } catch (error) {
    console.error('[Meta CAPI] Error:', error.response?.data || error.message);
    return false;
  }
};

// Module 2: Webhook endpoint - triggered when a lead status changes in UI
// PUT /api/leads/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) return res.status(400).json({ error: 'Status is required.' });

    // 1. Update status in Supabase
    const { data: lead, error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error || !lead) throw error;

    // 2. Trigger Meta CAPI if they marked it as Qualified
    let metaResult = false;
    if (status === 'Qualified') {
      metaResult = await sendToMetaCAPI(lead);
    }

    res.status(200).json({ message: 'Lead status updated successfully', lead, meta_capi_fired: metaResult });
  } catch (error) {
    console.error('[Lead Route] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Module 1 endpoint: Save a new lead from the client's website form
// POST /api/leads
router.post('/', async (req, res) => {
  try {
    // Note: client's website form must include their user_id so we know whose lead it is!
    const { user_id, name, email, phone, fbclid, gclid, source } = req.body;

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    // Insert into Supabase
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([{ user_id, name, email, phone, fbclid, gclid, source, status: 'New' }])
      .select()
      .single();

    if (error) throw error;

    console.log('[Lead Route] New live lead captured in DB:', lead.id);
    res.status(201).json({ message: 'Lead saved successfully', lead });
  } catch (error) {
    console.error('[Lead Route] Error saving lead:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
