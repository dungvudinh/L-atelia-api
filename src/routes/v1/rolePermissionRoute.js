// routes/rolePermissionRoutes.js
// const express = require('express');
// const rolePermissionController = require('../controllers/rolePermissionController');
// const authMiddleware = require('../middlewares/authMiddleware');
import express from 'express'
import rolePermissionController from '../../controllers/rolePermissionController.js'
import authMiddleware from '../../middlewares/authMiddleware.js'
const router = express.Router();
// All routes require authentication and admin role
router.use(authMiddleware.verifyToken, authMiddleware.isAdmin);

router.get('/', rolePermissionController.getAllRolePermissions);
router.get('/:role', rolePermissionController.getRolePermission);
router.put('/:role', rolePermissionController.updateRolePermissions);

export default router;