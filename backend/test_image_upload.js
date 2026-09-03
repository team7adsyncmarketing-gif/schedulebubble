import { supabase } from '../backend/config/supabase.js';
import sharp from 'sharp';

async function testUpload() {
  try {
    const rawBuffer = Buffer.from('fake image data', 'utf-8');
    
    // Simulate what mediaController does
    let fileBuffer = rawBuffer;
    let mimeType = 'image/png';
    let originalName = 'test image.png';
    const userId = '123e4567-e89b-12d3-a456-426614174000'; // Fake UUID
    
    try {
        fileBuffer = await sharp({
          create: {
            width: 300,
            height: 200,
            channels: 4,
            background: { r: 255, g: 0, b: 0, alpha: 0.5 }
          }
        }).png().toBuffer();
    } catch (e) {
        console.log('sharp error', e);
    }
    
    const fileExt = originalName.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log('Uploading...', filePath, mimeType, fileBuffer.length);
    
    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });
  
    if (error) {
      console.error("Supabase upload error:", error);
    } else {
      console.log("Upload success:", data);
    }
  } catch (err) {
      console.error('Fatal error', err);
  }
}

testUpload();
