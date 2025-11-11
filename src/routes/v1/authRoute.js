// routes/authRoutes.js
// const express = require('express');
// const authController = require('../controllers/authController');
// const authMiddleware = require('../middlewares/authMiddleware');
// const validationMiddleware = require('../middlewares/validationMiddleware');
import express from 'express';
import authController from '../../controllers/authController.js';
import authMiddleware from '../../middlewares/authMiddleware.js'
import validationMiddleware from '../../middlewares/validationMiddleware.js';
const router = express.Router();
// Public routes
router.post('/login', validationMiddleware.validateLogin, authController.login);

// Protected routes
router.get('/me', authMiddleware.verifyToken, authController.getCurrentUser);

export default router;