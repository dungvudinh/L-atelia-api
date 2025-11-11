// controllers/rolePermissionController.js
// const rolePermissionService = require('../services/rolePermissionService');
// const { validationResult } = require('express-validator');
import rolePermissionService from '../services/rolePermissionService.js';
import { validationResult } from 'express-validator';
const rolePermissionController = {
  // Get all role permissions
  getAllRolePermissions: async (req, res) => {
    try {
      const roles = await rolePermissionService.getAllRolePermissions();

      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Get role permission by role
  getRolePermission: async (req, res) => {
    try {
      const rolePermission = await rolePermissionService.getRolePermission(req.params.role);

      if (!rolePermission) {
        return res.status(404).json({
          success: false,
          message: 'Role permission not found'
        });
      }

      res.json({
        success: true,
        data: rolePermission
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  },

  // Update role permissions
  updateRolePermissions: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array()
        });
      }

      const { permissions } = req.body;
      const rolePermission = await rolePermissionService.updateRolePermissions(req.params.role, permissions);

      res.json({
        success: true,
        message: 'Role permissions updated successfully',
        data: rolePermission
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
};

export default rolePermissionController;