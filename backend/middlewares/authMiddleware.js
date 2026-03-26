// middlewares/authMiddleware.js
// BLOCK 4: Token verification and role-based authorization middleware

const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────────────────────────────────────
// verifyToken
// Validates the Authorization: Bearer <token> header.
// If valid, writes the decoded payload to req.user and calls next().
// ─────────────────────────────────────────────────────────────────────────────
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { user_id, email, role_name, username }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// checkRole
// Accepts an array of allowed roles as a parameter.
// Example usage: checkRole(['Admin']) or checkRole(['Admin', 'Manager'])
// Must be used after the verifyToken middleware.
// ─────────────────────────────────────────────────────────────────────────────
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role_name) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions. Role information not found.',
      });
    }

    const hasPermission = allowedRoles.includes(req.user.role_name);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your current role: ${req.user.role_name}.`,
      });
    }

    next();
  };
};

module.exports = { verifyToken, checkRole };
