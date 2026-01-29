// models/mediaModel.js
import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['lifestyle', 'properties', 'product'],
    default: 'lifestyle'
  },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  // Cập nhật featuredImage để hỗ trợ thumbnail
  featuredImage: {
    url: {
      type: String,
      required: false
    },
    thumbnailUrl: {  // ✅ Thêm field thumbnailUrl
      type: String,
      required: false
    },
    key: {
      type: String,
      required: false
    },
    thumbnailKey: {  // ✅ Thêm field thumbnailKey
      type: String,
      required: false
    },
    filename: {
      type: String,
      required: false,
      default: ''
    },
    originalName: {  // ✅ Thêm field originalName
      type: String,
      required: false
    },
    size: {
      type: Number,
      required: false,
      default: 0
    },
    thumbnailSize: {  // ✅ Thêm field thumbnailSize
      type: Number,
      required: false,
      default: 0
    },
    hasThumbnail: {  // ✅ Thêm field hasThumbnail
      type: Boolean,
      default: false
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    storage: {
      type: String,
      enum: ['b2', 'local'],
      default: 'b2'
    }
  },
  tags: [String],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update updatedAt
mediaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Media = mongoose.model('Media', mediaSchema);