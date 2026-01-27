// models/Project.js
import mongoose from 'mongoose';

// Schema đơn giản hóa
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  uploaded_at: { type: Date, default: Date.now }
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
  
  // Images - CHỈ LƯU URL
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

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Project = mongoose.model('Project', projectSchema);