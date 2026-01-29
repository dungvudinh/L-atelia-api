// models/projectModel.js
import mongoose from 'mongoose';

// Schema với thumbnail support
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },           // Original image URL
  thumbnailUrl: { type: String, default: null },   // Thumbnail URL (nếu có)
  key: { type: String, default: null },            // B2 key for original
  thumbnailKey: { type: String, default: null },   // B2 key for thumbnail
  filename: { type: String, required: true },
  size: { type: Number, default: 0 },
  thumbnailSize: { type: Number, default: 0 },
  uploaded_at: { type: Date, default: Date.now },
  hasThumbnail: { type: Boolean, default: false }
}, { _id: true });

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  location: String,
  
  // Images - LƯU CẢ ORIGINAL VÀ THUMBNAIL
  heroImage: imageSchema,
  gallery: [imageSchema],
  constructionProgress: [imageSchema],
  designImages: [imageSchema],
  brochure: [imageSchema],

  // Property Information
  propertyFeatures: [{
    text: String
  }],
  
  specifications: [{
    text: String
  }],

  propertyHighlights: [{
    title: String,
    description: String,
    featureSections: [{
      name: String,
      description: String
    }]
  }],

  specialSections: [{
    type: { type: String, enum: ['architecture', 'history', 'details'] },
    title: String,
    shortDescription: String,
    fullDescription: String,
    isExpandable: { type: Boolean, default: true }
  }],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Project = mongoose.model('Project', projectSchema);