import { supabase } from '../backend/config/supabase.js';

async function testUpload() {
  const fileBuffer = Buffer.from('hello world', 'utf-8');
  const fileName = `test-${Date.now()}.txt`;
  
  const { data, error } = await supabase.storage
    .from('media')
    .upload(fileName, fileBuffer, {
      contentType: 'text/plain',
      upsert: false
    });

  if (error) {
    console.error("Supabase upload error:", error);
  } else {
    console.log("Upload success:", data);
  }
}

testUpload();
