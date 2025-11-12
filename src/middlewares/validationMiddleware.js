// middlewares/validationMiddleware.js
// const { body } = require('express-validator');
import { body } from 'express-validator';
const validationMiddleware = {
  // User validation
  validateUserCreate: [
    body('username')
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers and underscores'),
    
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    
    body('fullName')
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 2 characters long'),
    
    body('role')
      .isIn(['admin', 'project_manager', 'media_manager', 'rent_manager', 'booking_manager'])
      .withMessage('Invalid role')
  ],
  validateUserUpdate: [
    body('username')
      .optional()
      .isLength({ min: 3 })
      .withMessage('Username must be at least 3 characters long')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers and underscores'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Please provide a valid email'),
    
    body('password')
      .optional() // ✅ Password không bắt buộc khi update
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'),
    
    body('fullName')
      .optional()
      .isLength({ min: 2 })
      .withMessage('Full name must be at least 2 characters long'),
    
    body('role')
      .optional()
      .isIn(['admin', 'project_manager', 'media_manager', 'rent_manager', 'booking_manager'])
      .withMessage('Invalid role'),
    
    // body('phone')
    //   .optional()
    //   .isMobilePhone()
    //   .withMessage('Please provide a valid phone number'),
    
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value')
  ],
  // Login validation
  validateLogin: [
    body('username')
      .notEmpty()
      .withMessage('Username or email is required'),
    
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],

  // Change password validation
  validateChangePassword: [
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number and one special character')
  ],
  // Bulk status validation
  validateBulkStatus: [
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('User IDs must be an array with at least one element'),
    
    body('userIds.*')
      .isMongoId()
      .withMessage('Each user ID must be a valid MongoDB ID'),
    
    body('isActive')
      .isBoolean()
      .withMessage('isActive must be a boolean value')
  ]
};

export default  validationMiddleware;