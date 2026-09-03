import jwt from 'jsonwebtoken';
import fetch from 'node-fetch'; // We can use native fetch in node 18+ but just to be sure
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const userId = '86ed811c-049a-45cd-9800-535baa758d9a'; // from test_post.js log
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

  const payload = {
    content: 'hii',
    destinations: [
      { platform: 'meta', id: 'instagram' }, // simulating undefined profileId
      { platform: 'meta', id: 'facebook', profileId: '68da08c6-d11c-44d7-9fc9-f0b3f3ea9652' }
    ],
    platforms: ['meta', 'meta'],
    mediaUrls: ['https://supabase.co/storage/v1/object/public/media_assets/123/img.png'],
    status: 'published',
    scheduledFor: new Date().toISOString()
  };

  try {
    const res = await fetch('https://schedulebubble.onrender.com/api/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
