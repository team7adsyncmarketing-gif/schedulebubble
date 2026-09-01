import { supabase } from '../config/supabase.js';

// @desc    Upload profile picture
// @route   PUT /api/users/profile-picture
// @access  Private
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `profile-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${req.user.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error("Supabase storage error:", error);
      return res.status(500).json({ message: 'Failed to upload image' });
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    const { data: updatedUser, error: updateError } = await supabase
      .from('profiles')
      .update({ profile_picture: publicUrl })
      .eq('id', req.user.id)
      .select()
      .single();

    if (updateError || !updatedUser) {
      return res.status(404).json({ message: 'User not found or error updating' });
    }

    res.status(200).json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePicture: updatedUser.profile_picture,
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error uploading profile picture' });
  }
};
