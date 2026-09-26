import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/constants.js';

/**
 * Middleware: Verify Bearer JWT token.
 * Returns 401 (Unauthorized) when no token is present — not 403.
 * 403 is reserved for authenticated users without sufficient permissions.
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized. Malformed authorization header.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, municipality_id, full_name, status }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Middleware factory: Restrict route to specific roles.
 * Call AFTER verifyToken.
 */
export const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};
