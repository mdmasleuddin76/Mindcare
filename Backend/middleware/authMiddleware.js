// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import User from '../models/User.js'; // Optional: If you need user data in protected routes

export const protect = async (req, res, next) => { // Make async if fetching user data
  let token;

  // Read the JWT from the cookie
  if (req.cookies.token) {
    token = req.cookies.token;
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Get user from the token payload (optional, but often useful)
    // This attaches the user object (minus password) to the request
    req.user = await User.findById(decoded.user.id).select('-password');

     if (!req.user) {
         // Handle case where user associated with token no longer exists
         res.clearCookie('token'); // Clear the invalid cookie
         return res.status(401).json({ message: 'Not authorized, user not found' });
     }

    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    console.error('Token verification error in middleware:', err.message);
    res.clearCookie('token'); // Clear the invalid cookie
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};