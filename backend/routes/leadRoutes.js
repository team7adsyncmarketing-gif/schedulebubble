import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

// Helper: Hash email/phone with SHA256 for Meta privacy requirements
const hashData = (data) => {
  if (!data) return undefined;
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
};

// Module 3: The Meta CAPI Sync Engine
const sendToMetaCAPI = async (lead) => {
  try {
    if (!lead.fbclid) {
      console.log('[Meta CAPI] No fbclid found, skipping Meta sync.');
      return false;
    }

    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const testCode = process.env.META_TEST_CODE;

    if (!pixelId || !accessToken) {
      console.error('[Meta CAPI] Missing META_PIXEL_ID or META_ACCESS_TOKEN in .env');
      return false;
    }

    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
      data: [
        {
          event_name: 'Lead',
          event_time: eventTime,
          action_source: 'system_generated',
          user_data: {
            fbc: `fb.1.${eventTime}.${lead.fbclid}`,
            em: hashData(lead.email),
            ph: hashData(lead.phone),
          },
          custom_data: {
            lead_status: 'Qualified',
          },
        },
      ],
    };

    // Add test code only if it exists (for sandbox/test mode)
    if (testCode) {
      payload.test_event_code = testCode;
    }

    const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
    const response = await axios.post(url, payload);

    console.log('[Meta CAPI] Successfully sent Qualified Lead event:', response.data);
    return true;
  } catch (error) {
    console.error('[Meta CAPI] Error:', error.response?.data || error.message);
    return false;
  }
};

// Module 2: Webhook endpoint - triggered when a lead status changes
// PUT /api/leads/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, email, phone, fbclid, gclid } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required.' });
    }

    // TODO: Update actual DB record here when Supabase leads table is ready
    // const { data, error } = await supabase.from('leads').update({ status }).eq('id', id).select().single();

    const lead = { id, status, email, phone, fbclid, gclid };

    // Trigger Meta CAPI only for Qualified leads that have fbclid
    if (status === 'Qualified') {
      const metaResult = await sendToMetaCAPI(lead);
      return res.status(200).json({
        message: 'Lead status updated successfully',
        lead,
        meta_capi_fired: metaResult,
      });
    }

    res.status(200).json({ message: 'Lead status updated successfully', lead, meta_capi_fired: false });
  } catch (error) {
    console.error('[Lead Route] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Module 1 endpoint: Save a new lead (with fbclid/gclid captured from frontend tracker)
// POST /api/leads
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, fbclid, gclid, source } = req.body;

    // TODO: Insert into Supabase leads table when ready
    // const { data, error } = await supabase.from('leads').insert([{ name, email, phone, fbclid, gclid, source }]).select().single();

    const lead = { id: crypto.randomUUID(), name, email, phone, fbclid, gclid, source, status: 'New' };

    console.log('[Lead Route] New lead captured:', lead);
    res.status(201).json({ message: 'Lead saved successfully', lead });
  } catch (error) {
    console.error('[Lead Route] Error saving lead:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
