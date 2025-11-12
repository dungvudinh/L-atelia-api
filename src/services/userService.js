// services/userService.js
// const User = require('../models/User');
// const RolePermission = require('../models/RolePermission');
import userModel from "../models/userModel.js";
// import RolePermission from '../models/RolePermission';
const userService = {
  // Create new user
  createUser: async (userData, createdBy) => {
    const user = new userModel({
      ...userData,
      createdBy: createdBy
    });
    return await user.save();
  },

  // Get all users with pagination
  getAllUsers: async (page = 1, limit = 10, search = '') => {
    const skip = (page - 1) * limit;
    const query = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }

    const [users, total] = await Promise.all([
      userModel.find(query)
        .select('-password')
        .populate('createdBy', 'username fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      userModel.countDocuments(query)
    ]);

    return {
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };
  },

  // Get user by ID
  getUserById: async (id) => {
    return await userModel.findById(id).select('-password');
  },

  // Get user by username or email
  getUserByUsernameOrEmail: async (identifier) => {
    return await userModel.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });
  },

  // Update user
  updateUser: async (id, updateData) => {
    // Remove password from update data if present
    const { password, ...safeUpdateData } = updateData;
    
    return await userModel.findByIdAndUpdate(
      id,
      safeUpdateData,
      { new: true, runValidators: true }
    ).select('-password');
  },

  // Delete user
  deleteUser: async (id) => {
    return await userModel.findByIdAndDelete(id);
  },

  // Change user password
  changePassword: async (id, newPassword) => {
    const user = await userModel.findById(id);
    user.password = newPassword;
    return await user.save();
  },

  // Update last login
  updateLastLogin: async (id) => {
    return await userModel.findByIdAndUpdate(
      id,
      { lastLogin: new Date() },
      { new: true }
    ).select('-password');
  }, 
  // Change user status
  changeUserStatus: async (id, isActive) => {
    const user = await userModel.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
  bulkChangeStatus: async (userIds, isActive) => {
    const result = await userModel.updateMany(
      { 
        _id: { $in: userIds },
        role: { $ne: 'admin' } // Prevent modifying admin users
      },
      { isActive }
    );

    return result;
  }
};

export default userService;