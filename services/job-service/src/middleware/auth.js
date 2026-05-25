'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');

// Note: job-service does not need to query User from DB
// JWT payload contains userId which is sufficient
// We only need the decoded token data for authorization

const authMiddleware = (req, res, next) => {
  try {
    let token = req.cookies.access_token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach decoded token data to request
    // role and userId come from JWT payload
    req.user = {
      _id: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authMiddleware;
