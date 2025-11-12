// routes/userRoutes.js
// const express = require('express');
// const userController = require('../controllers/userController');
// const authMiddleware = require('../middlewares/authMiddleware');
// const validationMiddleware = require('../middlewares/validationMiddleware');
import express from 'express'
import userController from '../../controllers/userController.js'
import authMiddleware from '../../middlewares/authMiddleware.js'
import validationMiddleware from '../../middlewares/validationMiddleware.js';
const router = express.Router();
// All routes require authentication
router.use(authMiddleware.verifyToken);

// Only admin can manage users
router.post(
  '/',
  authMiddleware.isAdmin,
  validationMiddleware.validateUserCreate,
  userController.createUser
);

router.get(
  '/',
  authMiddleware.isAdmin,
  userController.getAllUsers
);

router.get(
  '/:id',
  authMiddleware.isAdmin,
  userController.getUserById
);

router.put(
  '/:id',
  authMiddleware.isAdmin,
  validationMiddleware.validateUserUpdate,
  userController.updateUser
);

router.delete(
  '/:id',
  authMiddleware.isAdmin,
  userController.deleteUser
);

router.patch(
  '/:id/change-password',
  authMiddleware.isAdmin,
  validationMiddleware.validateChangePassword,
  userController.changePassword
);
router.patch(
  '/:id/status',
  authMiddleware.isAdmin,
  userController.changeUserStatus
);

router.patch(
  '/bulk/status',
  authMiddleware.isAdmin,
  userController.bulkChangeStatus
);
export default router;