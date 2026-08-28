import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      const token = generateToken(res, user._id);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        token,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error("🔥 LOGIN CRASH INFO:", error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(res, user._id);

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = {
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      profilePicture: req.user.profilePicture,
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
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      
      const updatedUser = await user.save();

      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePicture: updatedUser.profilePicture,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export { registerUser, loginUser, logoutUser, getMe, updateProfile };
