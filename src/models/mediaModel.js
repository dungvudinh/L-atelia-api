// models/mediaModel.js
import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  content: {
    type: String, // HTML content từ TinyMCE
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
  featuredImage: String,
  tags: [String],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update updatedAt
mediaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Media = mongoose.model('Media', mediaSchema);