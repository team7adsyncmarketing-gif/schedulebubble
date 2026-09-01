import { supabase } from '../config/supabase.js';

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = {
      _id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      profilePicture: req.user.profile_picture,
    };

    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update({ name: name })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error || !updatedUser) {
      return res.status(404).json({ message: 'User not found or error updating' });
    }

    res.status(200).json({
      _id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      profilePicture: updatedUser.profile_picture,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export { getMe, updateProfile };
