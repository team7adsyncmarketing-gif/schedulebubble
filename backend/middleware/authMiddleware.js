import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  let token;

  // Read the JWT from the cookie
  token = req.cookies?.jwt;

  // Alternatively, check authorization header (if cookies are not used exclusively)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (token === 'null' || token === 'undefined') {
    token = null;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select('-password');

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

export { protect };
