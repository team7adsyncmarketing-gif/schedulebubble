import multer from 'multer';
import sharp from 'sharp';
import { supabase } from '../config/supabase.js';

// Setup multer for memory storage
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// @desc    Upload a new media asset
// @route   POST /api/media/upload
// @access  Private
export const uploadAsset = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    if (!req.user || !req.user.id) return res.status(401).json({ message: 'User context missing' });

    let fileBuffer = req.file.buffer;
    let mimeType = req.file.mimetype;
    let originalName = req.file.originalname;

    // If it's an image, resize and pad it to 1080x1080 for universal social media compatibility
    if (mimeType.startsWith('image/') && !mimeType.includes('gif')) {
      try {
        fileBuffer = await sharp(req.file.buffer)
          .resize(1080, 1080, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 1 }
          })
          .toFormat('jpeg', { quality: 90 })
          .toBuffer();
        mimeType = 'image/jpeg';
        originalName = originalName.replace(/\.[^/.]+$/, "") + '.jpg';
      } catch (err) {
        console.error("Image processing error:", err);
      }
    }

    const fileExt = originalName.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${req.user.id}/${fileName}`;

    // Convert Buffer to ArrayBuffer for reliable cross-platform fetch in Supabase storage-js
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength);

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      console.error("Supabase storage error:", error);
      return res.status(500).json({ message: 'Failed to upload image to Supabase', details: error.message || error });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    // Save to Postgres (Wait, do we have a media table? No, media_urls is stored in posts. But this route implies a MediaAsset table. Let's create it in Postgres too, or just return the URL).
    // The previous implementation used MediaAsset. Let's just create a quick table via supabase query, or add it to schema.sql.
    // Wait, let's just query supabase.
    const { data: mediaAsset, error: dbError } = await supabase
      .from('media_assets')
      .insert({
        user_id: req.user.id,
        file_url: publicUrl,
        file_name: req.file.originalname
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase DB error:", dbError);
      return res.status(500).json({ message: 'Failed to save media asset to database' });
    }

    res.status(201).json({
      _id: mediaAsset.id,
      fileUrl: mediaAsset.file_url,
      fileName: mediaAsset.file_name,
      createdAt: mediaAsset.created_at
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: 'Server error uploading asset' });
  }
};

// @desc    Get all media assets for logged in user
// @route   GET /api/media
// @access  Private
export const getAssets = async (req, res) => {
  try {
    const { data: assets, error } = await supabase
      .from('media_assets')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mappedAssets = assets.map(a => ({
      _id: a.id,
      fileUrl: a.file_url,
      fileName: a.file_name,
      createdAt: a.created_at
    }));

    res.status(200).json(mappedAssets);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ message: 'Server error fetching assets' });
  }
};

// @desc    Delete a media asset
// @route   DELETE /api/media/:id
// @access  Private
export const deleteAsset = async (req, res) => {
  try {
    const { data: asset, error: findError } = await supabase
      .from('media_assets')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (findError || !asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Try to remove from Supabase Storage
    if (asset.file_url && asset.file_url.includes('supabase.co')) {
      const parts = asset.file_url.split('/media/');
      if (parts.length > 1) {
        const filePath = parts[1];
        await supabase.storage.from('media').remove([filePath]);
      }
    }

    await supabase.from('media_assets').delete().eq('id', asset.id);
    res.status(200).json({ message: 'Asset deleted' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Server error deleting asset' });
  }
};
