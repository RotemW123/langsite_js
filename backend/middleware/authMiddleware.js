const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Add this import

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
      maxAge: "1h"
    });

    // Verify user still exists in database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user to request object
    req.user = user;
    
    next();
  } catch (err) {
    console.log('🔴 Auth Error:', err.message);
    
    // Send specific error messages for different scenarios
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = { authMiddleware };