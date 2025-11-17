// models/Project.js
import mongoose from 'mongoose';

const featureSectionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String
}, { _id: true });

const propertyHighlightSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  featureSections: [featureSectionSchema]
}, { _id: true });

const specialSectionSchema = new mongoose.Schema({
  type: String,
  title: { type: String, required: true },
  shortDescription: String,
  fullDescription: String,
  isExpandable: { type: Boolean, default: true }
}, { _id: true });

// Schema cho image với uploaded_at
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
  
  // Images - ĐÃ LOẠI BỎ floorPlans, THÊM uploaded_at
  heroImage: {
    type: imageSchema,
    default: null
  },
  gallery: [imageSchema],
  constructionProgress: [imageSchema], // 👈 ĐÃ THÊM uploaded_at
  designImages: [imageSchema],
  brochure: [imageSchema],

  // Property Information
  propertyFeatures: [{
    text: String
  }],
  
  specifications: [{
    text: String
  }],

  // Highlights and Sections
  propertyHighlights: [propertyHighlightSchema],
  specialSections: [specialSectionSchema],

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-generate slug before save
projectSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  this.updatedAt = Date.now();
  next();
});

export const Project = mongoose.model('Project', projectSchema);