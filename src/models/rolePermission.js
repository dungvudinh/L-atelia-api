// models/RolePermission.js
// const mongoose = require('mongoose');
import mongoose from 'mongoose';
const rolePermissionSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['admin', 'project_manager', 'media_manager', 'rent_manager', 'booking_manager'],
    required: true,
    unique: true
  },
  permissions: {
    users: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    projects: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    media: {
      view: { type: Boolean, default: false },
      upload: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    rents: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    bookings: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

export default  mongoose.model('RolePermission', rolePermissionSchema);