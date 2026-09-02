import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testDelete() {
  const { data: assets, error } = await supabase.from('media_assets').select('*');
  console.log('All Assets:', assets);
  
  if (assets && assets.length > 0) {
    const assetToTest = assets[0];
    console.log('Testing delete with ID:', assetToTest.id, 'and User ID:', assetToTest.user_id);
    
    const { data: fetchAsset, error: findError } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', assetToTest.id)
      .eq('user_id', assetToTest.user_id)
      .single();
      
    console.log('Fetch Result:', fetchAsset, 'Error:', findError);
  }
}

testDelete();
