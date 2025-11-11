// middlewares/authMiddleware.js
// const authService = require('../services/authService');
import authService from '../services/authService.js';
const authMiddleware = {
  // Verify token
  verifyToken: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    try {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  },

  // Check role permission
  checkPermission: (module, action) => {
    return async (req, res, next) => {
      try {
        const rolePermission = await rolePermissionService.getRolePermission(req.user.role);
        
        if (!rolePermission || !rolePermission.permissions[module]?.[action]) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.'
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    };
  },

  // Check if admin
  isAdmin: (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }
    next();
  }
};

export default authMiddleware;