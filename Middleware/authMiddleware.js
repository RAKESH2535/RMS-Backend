const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  try {
    // Log the incoming headers for debugging
    console.log('Authorization header:', req.headers.authorization);
    console.log('All headers:', req.headers);

    // Get token from request headers
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    console.log('Extracted token:', token);

    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Verify the token
    const decoded = jwt.verify(token, 'RANDOM-TOKEN'); // Use the same secret as when generating the token
    console.log('Decoded token:', decoded);

    // Attach user information to the req object
    req.user = {
      userId: decoded.userId,
      userEmail: decoded.userEmail,
      userName: decoded.userName,
      role: decoded.role,
      tenant_id: decoded.tenant_id || null // Include tenant_id if present
    };

    next(); // Proceed to the next middleware/route
  } catch (error) {
    console.log('Token verification error:', error.message);
    res.status(401).json({ message: 'Token is not valid', error: error.message });
  }
};

module.exports = authMiddleware;