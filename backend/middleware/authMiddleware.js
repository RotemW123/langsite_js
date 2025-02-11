const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify token using the environment variable
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user to request object - make sure we use the same property name as in token creation
    req.user = decoded;  // This will have { id: user._id } from the token
    
    next();
  } catch (err) {
    console.log('🔴 Auth Error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;