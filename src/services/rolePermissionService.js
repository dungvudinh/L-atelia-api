// services/rolePermissionService.js
import RolePermissionModel from '../models/rolePermission.js';
const rolePermissionService = {
  // Initialize default roles
  initializeRoles: async () => {
    const defaultRoles = [
      {
        role: 'admin',
        permissions: {
          users: { view: true, create: true, edit: true, delete: true },
          projects: { view: true, create: true, edit: true, delete: true },
          media: { view: true, upload: true, edit: true, delete: true },
          rents: { view: true, create: true, edit: true, delete: true },
          bookings: { view: true, create: true, edit: true, delete: true }
        }
      },
      {
        role: 'project_manager',
        permissions: {
          users: { view: false, create: false, edit: false, delete: false },
          projects: { view: true, create: true, edit: true, delete: true },
          media: { view: true, upload: false, edit: false, delete: false },
          rents: { view: false, create: false, edit: false, delete: false },
          bookings: { view: false, create: false, edit: false, delete: false }
        }
      },
      {
        role: 'media_manager',
        permissions: {
          users: { view: false, create: false, edit: false, delete: false },
          projects: { view: true, create: false, edit: false, delete: false },
          media: { view: true, upload: true, edit: true, delete: true },
          rents: { view: false, create: false, edit: false, delete: false },
          bookings: { view: false, create: false, edit: false, delete: false }
        }
      },
      {
        role: 'rent_manager',
        permissions: {
          users: { view: false, create: false, edit: false, delete: false },
          projects: { view: true, create: false, edit: false, delete: false },
          media: { view: true, upload: false, edit: false, delete: false },
          rents: { view: true, create: true, edit: true, delete: true },
          bookings: { view: true, create: false, edit: false, delete: false }
        }
      },
      {
        role: 'booking_manager',
        permissions: {
          users: { view: false, create: false, edit: false, delete: false },
          projects: { view: true, create: false, edit: false, delete: false },
          media: { view: true, upload: false, edit: false, delete: false },
          rents: { view: true, create: false, edit: false, delete: false },
          bookings: { view: true, create: true, edit: true, delete: true }
        }
      }
    ];

    for (const roleData of defaultRoles) {
      await RolePermissionModel.findOneAndUpdate(
        { role: roleData.role },
        roleData,
        { upsert: true, new: true }
      );
    }
  },

  // Get all role permissions
  getAllRolePermissions: async () => {
    return await RolePermissionModel.find().sort({ role: 1 });
  },

  // Get role permission by role
  getRolePermission: async (role) => {
    return await RolePermissionModel.findOne({ role });
  },

  // Update role permissions
  updateRolePermissions: async (role, permissions) => {
    return await RolePermissionModel.findOneAndUpdate(
      { role },
      { permissions },
      { new: true, runValidators: true }
    );
  }
};

export default  rolePermissionService;